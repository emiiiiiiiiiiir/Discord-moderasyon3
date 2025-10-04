require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

client.once('ready', () => {
    console.log(`✅ Bot hazır! ${client.user.tag} olarak giriş yapıldı.`);
    client.user.setActivity('Moderasyon', { type: 'WATCHING' });
});

client.on('guildMemberAdd', async (member) => {
    const autoRoleId = process.env.AUTO_ROLE_ID;
    
    if (autoRoleId) {
        try {
            const role = member.guild.roles.cache.get(autoRoleId);
            if (role) {
                await member.roles.add(role);
                console.log(`✅ ${member.user.tag} kullanıcısına otomatik rol verildi: ${role.name}`);
            }
        } catch (error) {
            console.error('Otomatik rol verme hatası:', error);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri Yasakla" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Yasaklamak için bir kullanıcı etiketlemelisiniz! Örnek: `!ban @kullanıcı sebep`');
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
        const targetMember = message.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        if (!targetMember.bannable) {
            return message.reply('❌ Bu kullanıcıyı yasaklayamam! (Yetki seviyesi benden yüksek olabilir)');
        }

        try {
            await targetMember.ban({ reason: reason });
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Kullanıcı Yasaklandı')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Ban hatası:', error);
            message.reply('❌ Kullanıcı yasaklanırken bir hata oluştu!');
        }
    }

    if (commandName === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri At" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Atmak için bir kullanıcı etiketlemelisiniz! Örnek: `!kick @kullanıcı sebep`');
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
        const targetMember = message.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        if (!targetMember.kickable) {
            return message.reply('❌ Bu kullanıcıyı atamam! (Yetki seviyesi benden yüksek olabilir)');
        }

        try {
            await targetMember.kick(reason);
            
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('👢 Kullanıcı Atıldı')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Kick hatası:', error);
            message.reply('❌ Kullanıcı atılırken bir hata oluştu!');
        }
    }

    if (commandName === 'duyuru') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Bu komutu kullanmak için "Mesajları Yönet" yetkisine sahip olmalısınız!');
        }

        const announcement = args.join(' ');
        if (!announcement) {
            return message.reply('❌ Duyuru mesajı belirtmelisiniz! Örnek: `!duyuru Önemli bir duyuru`');
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📢 DUYURU')
                .setDescription(announcement)
                .setFooter({ text: `Duyuran: ${message.author.tag}` })
                .setTimestamp();

            await message.delete();
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Duyuru hatası:', error);
            message.reply('❌ Duyuru gönderilirken bir hata oluştu!');
        }
    }

    if (commandName === 'yardım' || commandName === 'yardim' || commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🤖 Bot Komutları')
            .setDescription('Discord Moderasyon Botu - Komut Listesi')
            .addFields(
                { name: '🔨 !ban @kullanıcı [sebep]', value: 'Kullanıcıyı sunucudan yasaklar' },
                { name: '👢 !kick @kullanıcı [sebep]', value: 'Kullanıcıyı sunucudan atar' },
                { name: '📢 !duyuru [mesaj]', value: 'Kanala duyuru gönderir' },
                { name: '❓ !yardım', value: 'Bu yardım menüsünü gösterir' },
                { name: '🎭 Otomatik Rol', value: 'Yeni üyelere otomatik rol verir (.env dosyasında AUTO_ROLE_ID ayarlanmalı)' }
            )
            .setFooter({ text: 'Moderasyon Botu' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Bot giriş hatası:', error);
    console.log('💡 .env dosyasında DISCORD_TOKEN ayarlandığından emin olun!');
});
