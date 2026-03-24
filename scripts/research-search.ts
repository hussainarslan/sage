#!/usr/bin/env bun
/**
 * research-search — Search across research reports and knowledge base.
 *
 * Usage:
 *   bun run scripts/research-search.ts <query>
 *   bun run scripts/research-search.ts "local-first AI" --knowledge
 *   bun run scripts/research-search.ts "vector database" --project my-project
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SAGE_DIR = path.join(os.homedir(), '.sage');
const PROJECTS_DIR = path.join(SAGE_DIR, 'projects');
const KNOWLEDGE_DIR = path.join(SAGE_DIR, 'knowledge');

interface SearchResult {
  type: 'report' | 'knowledge';
  path: string;
  title: string;
  date: string;
  matchLines: string[];
  project?: string;
}

function searchFile(filePath: string, query: string, maxMatches = 5): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const queryLower = query.toLowerCase();
  const matches: string[] = [];

  for (let i = 0; i < lines.length && matches.length < maxMatches; i++) {
    if (lines[i].toLowerCase().includes(queryLower)) {
      const lineNum = i + 1;
      const trimmed = lines[i].trim().slice(0, 120);
      matches.push(`  L${lineNum}: ${trimmed}`);
    }
  }

  return matches;
}

function searchProjects(query: string, projectFilter?: string): SearchResult[] {
  const results: SearchResult[] = [];
  if (!fs.existsSync(PROJECTS_DIR)) return results;

  const projects = fs.readdirSync(PROJECTS_DIR).filter(d =>
    fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory()
  );

  for (const project of projects) {
    if (projectFilter && project !== projectFilter) continue;

    const projectDir = path.join(PROJECTS_DIR, project);
    const files = fs.readdirSync(projectDir).filter(f => f.includes('-research-') && f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const matchLines = searchFile(filePath, query);
      if (matchLines.length > 0) {
        // Extract date from filename: user-research-topic-YYYYMMDD-HHMMSS.md
        const dateMatch = file.match(/(\d{8}-\d{6})/);
        const date = dateMatch ? dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'unknown';

        results.push({
          type: 'report',
          path: filePath,
          title: file,
          date,
          matchLines,
          project,
        });
      }
    }
  }

  return results;
}

function searchKnowledge(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  if (!fs.existsSync(KNOWLEDGE_DIR)) return results;

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const matchLines = searchFile(filePath, query);
    if (matchLines.length > 0) {
      // Try to extract date from file content
      const content = fs.readFileSync(filePath, 'utf-8');
      const dateMatch = content.match(/Last updated:\s*(\S+)/);
      const date = dateMatch ? dateMatch[1] : 'unknown';

      results.push({
        type: 'knowledge',
        path: filePath,
        title: file.replace('.md', ''),
        date,
        matchLines,
      });
    }
  }

  return results;
}

// --- CLI ---

const args = process.argv.slice(2);
const showKnowledge = args.includes('--knowledge') || args.includes('-k');
const projectIdx = args.indexOf('--project');
const projectFilter = projectIdx >= 0 ? args[projectIdx + 1] : undefined;

// Extract query (everything that's not a flag)
const query = args.filter(a => !a.startsWith('--') && (projectIdx < 0 || args.indexOf(a) !== projectIdx + 1)).join(' ');

if (!query) {
  console.error('Usage: bun run scripts/research-search.ts <query> [--knowledge] [--project <slug>]');
  process.exit(1);
}

console.log(`Searching for: "${query}"\n`);

let totalResults = 0;

if (!showKnowledge) {
  const projectResults = searchProjects(query, projectFilter);
  if (projectResults.length > 0) {
    console.log('📄 Research Reports');
    console.log('─'.repeat(60));
    for (const r of projectResults.sort((a, b) => b.date.localeCompare(a.date))) {
      console.log(`\n  [${r.project}] ${r.title}`);
      console.log(`  Date: ${r.date} | Path: ${r.path}`);
      for (const line of r.matchLines) {
        console.log(line);
      }
      totalResults++;
    }
  }
}

const knowledgeResults = searchKnowledge(query);
if (knowledgeResults.length > 0) {
  console.log('\n🧠 Knowledge Base');
  console.log('─'.repeat(60));
  for (const r of knowledgeResults.sort((a, b) => b.date.localeCompare(a.date))) {
    console.log(`\n  ${r.title}`);
    console.log(`  Updated: ${r.date} | Path: ${r.path}`);
    for (const line of r.matchLines) {
      console.log(line);
    }
    totalResults++;
  }
}

if (totalResults === 0) {
  console.log('No results found.');
} else {
  console.log(`\n${totalResults} result(s) found.`);
}
