#!/usr/bin/env node

// scripts/update-chains-snapshot.js
// CLI utility to update the EIP155 chains snapshot from chainlist.org

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getChainData } from '../src/namespaces/eip155/eip155.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the snapshot file
const SNAPSHOT_PATH = path.join(__dirname, '../src/namespaces/eip155/chains-snapshot.json');

/**
 * Write the snapshot file
 */
async function writeSnapshot(data) {
  console.log(`Writing snapshot to ${SNAPSHOT_PATH}...`);
  
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(SNAPSHOT_PATH, jsonData, 'utf8');
    console.log('✅ Snapshot file updated successfully');
  } catch (error) {
    console.error('❌ Failed to write snapshot file:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Updating EIP155 chains snapshot with ALL chains...');
  
  try {
    // Use the existing getChainData function with forceRefresh
    console.log('Fetching latest chain data...');
    const chainData = await getChainData(true); // forceRefresh = true
    
    // Write to file
    await writeSnapshot(chainData);
    
    console.log('🎉 Chains snapshot updated successfully!');
    console.log(`📊 Snapshot contains ${Object.keys(chainData).length} chains`);
    
  } catch (error) {
    console.error('💥 Failed to update snapshot:', error.message);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/update-chains-snapshot.js

Updates the EIP155 chains snapshot with ALL chains from chainlist.org.
No options needed - just fetches everything for maximum compatibility.

Examples:
  node scripts/update-chains-snapshot.js
  npm run update-chains
`);
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
