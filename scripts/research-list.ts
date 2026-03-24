#!/usr/bin/env bun
/**
 * research-list — CLI dashboard for viewing research sessions.
 *
 * Reads ~/.sage/projects/*/research-index.jsonl and ~/.sage/knowledge/index.jsonl
 * to display research history across all projects.
 *
 * Usage:
 *   bun run scripts/research-list.ts [--project <slug>] [--knowledge]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ResearchEntry {
  topic: string;
  topicSlug: string;
  date: string;
  depth: string;
  sourcesTotal: number;
  reportPath: string;
}

interface KnowledgeEntry {
  slug: string;
  title: string;
  updated: string;
  topics: string[];
  sourceCount: number;
}

const SAGE_DIR = path.join(os.homedir(), '.sage');
const PROJECTS_DIR = path.join(SAGE_DIR, 'projects');
const KNOWLEDGE_DIR = path.join(SAGE_DIR, 'knowledge');

function parseJsonl<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line) as T; }
      catch { return null; }
    })
    .filter((x): x is T => x !== null);
}

function listProjectResearch(projectFilter?: string): void {
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('No research sessions found. Run /research to get started.');
    return;
  }

  const projects = fs.readdirSync(PROJECTS_DIR).filter(d =>
    fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory()
  );

  let totalSessions = 0;

  for (const project of projects) {
    if (projectFilter && project !== projectFilter) continue;

    const indexPath = path.join(PROJECTS_DIR, project, 'research-index.jsonl');
    const entries = parseJsonl<ResearchEntry>(indexPath);
    if (entries.length === 0) continue;

    console.log(`\n📁 ${project}`);
    console.log('─'.repeat(60));

    for (const entry of entries.sort((a, b) => b.date.localeCompare(a.date))) {
      const dateStr = entry.date?.slice(0, 10) || 'unknown';
      const depth = (entry.depth || '?').padEnd(10);
      const sources = `${entry.sourcesTotal || '?'} sources`;
      console.log(`  ${dateStr}  ${depth}  ${sources.padEnd(12)}  ${entry.topic}`);
      totalSessions++;
    }
  }

  if (totalSessions === 0) {
    console.log('No research sessions found. Run /research to get started.');
  } else {
    console.log(`\n${totalSessions} research session(s) across ${projects.length} project(s).`);
  }
}

function listKnowledge(): void {
  const indexPath = path.join(KNOWLEDGE_DIR, 'index.jsonl');
  const entries = parseJsonl<KnowledgeEntry>(indexPath);

  if (entries.length === 0) {
    console.log('No knowledge base entries found. Run /research to build knowledge.');
    return;
  }

  console.log('\n🧠 Knowledge Base');
  console.log('─'.repeat(60));

  for (const entry of entries.sort((a, b) => b.updated.localeCompare(a.updated))) {
    const dateStr = entry.updated?.slice(0, 10) || 'unknown';
    const sources = `${entry.sourceCount || '?'} sources`;
    const topics = entry.topics?.join(', ') || '';
    console.log(`  ${dateStr}  ${sources.padEnd(12)}  ${entry.title}`);
    if (topics) console.log(`           ${''.padEnd(12)}  tags: ${topics}`);
  }

  console.log(`\n${entries.length} knowledge base entry/entries.`);
  console.log(`Location: ${KNOWLEDGE_DIR}/`);
}

// --- CLI ---

const args = process.argv.slice(2);
const showKnowledge = args.includes('--knowledge') || args.includes('-k');
const projectIdx = args.indexOf('--project');
const projectFilter = projectIdx >= 0 ? args[projectIdx + 1] : undefined;

if (showKnowledge) {
  listKnowledge();
} else {
  listProjectResearch(projectFilter);
}
