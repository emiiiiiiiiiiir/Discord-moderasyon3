const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');
const robloxAPI = require('./src/roblox');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

const ACCOUNT_LINKS_FILE = './account_links.json';
const PENDING_VERIFICATIONS_FILE = './pending_verifications.json';

function validateEnvironmentVariables() {
  const requiredVars = [
    { name: 'DISCORD_TOKEN', value: DISCORD_TOKEN },
    { name: 'DISCORD_CLIENT_ID', value: DISCORD_CLIENT_ID },
    { name: 'ROBLOX_COOKIE', value: ROBLOX_COOKIE }
  ];

  const missingVars = requiredVars.filter(v => !v.value);
  
  if (missingVars.length > 0) {
    console.error('HATA: Gerekli environment variable\'lar eksik:');
    missingVars.forEach(v => console.error(`  - ${v.name}`));
    console.error('\nLütfen Replit Secrets bölümünden bu değişkenleri ekleyin.');
    process.exit(1);
  }
  
  console.log('✓ Tüm environment variable\'lar mevcut');
}

function validateConfig() {
  const warnings = [];
