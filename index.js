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
const warnings = new Map();
const mutedUsers = new Map();

client.once('ready', () => {
    console.log(`✅ Bot hazır! ${client.user.tag} olarak giriş yapıldı.`);
    client.user.setActivity('b!yardım', { type: 'WATCHING' });
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
    if (!message.content.startsWith('b!') || message.author.bot) return;

    const args = message.content.slice(2).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === 'yardım' || commandName === 'yardim') {
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🤖 Bot Komutları')
            .setDescription('Discord Moderasyon Botu - Komut Listesi')
            .addFields(
                { name: '📋 Genel Komutlar', value: '`b!yardım` - Tüm komutları gösterir\n`b!bilgi` - Bot hakkında bilgi verir\n`b!ping` - Botun yanıt süresini gösterir\n`b!sunucu` - Sunucu bilgilerini gösterir\n`b!profil` - Profil bilgilerini gösterir\n`b!istatistik` - Bot istatistiklerini gösterir', inline: false },
                { name: '⚔️ Moderasyon Komutları', value: '`b!ban @kullanıcı [sebep]` - Kullanıcıyı yasaklar\n`b!kick @kullanıcı [sebep]` - Kullanıcıyı atar\n`b!mute @kullanıcı [süre]` - Kullanıcıyı susturur\n`b!unmute @kullanıcı` - Susturmayı kaldırır\n`b!uyarı @kullanıcı [sebep]` - Uyarı verir\n`b!uyarılar @kullanıcı` - Uyarı geçmişini gösterir\n`b!temizle [sayı]` - Mesaj siler\n`b!rol-ver @kullanıcı @rol` - Rol verir\n`b!rol-al @kullanıcı @rol` - Rol alır', inline: false }
            )
            .setFooter({ text: 'Moderasyon Botu' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'bilgi') {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('ℹ️ Bot Bilgileri')
            .addFields(
                { name: 'Bot Adı', value: `${client.user.tag}`, inline: true },
                { name: 'Sunucu Sayısı', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Kullanıcı Sayısı', value: `${client.users.cache.size}`, inline: true },
                { name: 'Prefix', value: '`b!`', inline: true },
                { name: 'Versiyon', value: '1.0.0', inline: true },
                { name: 'Discord.js', value: 'v14', inline: true }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Moderasyon Botu' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'ping') {
        const sent = await message.reply('🏓 Ping hesaplanıyor...');
        const timeDiff = sent.createdTimestamp - message.createdTimestamp;
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Mesaj Gecikmesi', value: `${timeDiff}ms`, inline: true },
                { name: 'API Gecikmesi', value: `${Math.round(client.ws.ping)}ms`, inline: true }
            )
            .setTimestamp();

        sent.edit({ content: null, embeds: [embed] });
    }

    if (commandName === 'sunucu') {
        const guild = message.guild;
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`🏰 ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Sunucu ID', value: guild.id, inline: true },
                { name: 'Sahip', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Üye Sayısı', value: `${guild.memberCount}`, inline: true },
                { name: 'Oluşturulma Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Kanal Sayısı', value: `${guild.channels.cache.size}`, inline: true }
            )
            .setFooter({ text: 'Sunucu Bilgileri' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'profil') {
        const targetUser = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle(`👤 ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: 'Kullanıcı ID', value: targetUser.id, inline: true },
                { name: 'Sunucuya Katılma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Hesap Oluşturma', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Roller', value: member.roles.cache.map(r => r.name).slice(0, 10).join(', ') || 'Yok', inline: false }
            )
            .setFooter({ text: 'Profil Bilgileri' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'istatistik') {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('📊 Bot İstatistikleri')
            .addFields(
                { name: 'Çalışma Süresi', value: `${hours}s ${minutes}d ${seconds}sn`, inline: true },
                { name: 'Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true },
                { name: 'Sunucu Sayısı', value: `${client.guilds.cache.size}`, inline: true },
                { name: 'Toplam Üye', value: `${client.users.cache.size}`, inline: true },
                { name: 'Kanal Sayısı', value: `${client.channels.cache.size}`, inline: true },
                { name: 'Bellek Kullanımı', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }
            )
            .setFooter({ text: 'Bot İstatistikleri' })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri Yasakla" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Yasaklamak için bir kullanıcı etiketlemelisiniz! Örnek: `b!ban @kullanıcı sebep`');
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
            return message.reply('❌ Atmak için bir kullanıcı etiketlemelisiniz! Örnek: `b!kick @kullanıcı sebep`');
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

    if (commandName === 'mute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri Zaman Aşımına Uğrat" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Susturmak için bir kullanıcı etiketlemelisiniz! Örnek: `b!mute @kullanıcı 10m`');
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        const timeArg = args[1] || '10m';
        let duration = 10 * 60 * 1000;
        
        const timeMatch = timeArg.match(/^(\d+)([smhd])$/);
        if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            
            switch (unit) {
                case 's': duration = value * 1000; break;
                case 'm': duration = value * 60 * 1000; break;
                case 'h': duration = value * 60 * 60 * 1000; break;
                case 'd': duration = value * 24 * 60 * 60 * 1000; break;
            }
        }

        try {
            await targetMember.timeout(duration, args.slice(2).join(' ') || 'Sebep belirtilmedi');
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🔇 Kullanıcı Susturuldu')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                    { name: 'Süre', value: timeArg, inline: true }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Mute hatası:', error);
            message.reply('❌ Kullanıcı susturulurken bir hata oluştu!');
        }
    }

    if (commandName === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri Zaman Aşımına Uğrat" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Susturmayı kaldırmak için bir kullanıcı etiketlemelisiniz! Örnek: `b!unmute @kullanıcı`');
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        try {
            await targetMember.timeout(null);
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('🔊 Susturma Kaldırıldı')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Unmute hatası:', error);
            message.reply('❌ Susturma kaldırılırken bir hata oluştu!');
        }
    }

    if (commandName === 'uyarı' || commandName === 'uyari') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Bu komutu kullanmak için "Üyeleri Yönet" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Uyarmak için bir kullanıcı etiketlemelisiniz! Örnek: `b!uyarı @kullanıcı sebep`');
        }

        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
        const userId = targetUser.id;

        if (!warnings.has(userId)) {
            warnings.set(userId, []);
        }

        warnings.get(userId).push({
            reason: reason,
            moderator: message.author.tag,
            timestamp: Date.now()
        });

        const warningCount = warnings.get(userId).length;

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Kullanıcı Uyarıldı')
            .addFields(
                { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                { name: 'Uyarı Sayısı', value: `${warningCount}`, inline: true },
                { name: 'Sebep', value: reason }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'uyarılar' || commandName === 'uyarilar') {
        const targetUser = message.mentions.users.first() || message.author;
        const userId = targetUser.id;

        if (!warnings.has(userId) || warnings.get(userId).length === 0) {
            return message.reply(`${targetUser.tag} kullanıcısının hiç uyarısı yok.`);
        }

        const userWarnings = warnings.get(userId);
        const warningList = userWarnings.map((w, i) => 
            `**${i + 1}.** ${w.reason}\n*Yetkili:* ${w.moderator} - <t:${Math.floor(w.timestamp / 1000)}:R>`
        ).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle(`⚠️ ${targetUser.tag} - Uyarı Geçmişi`)
            .setDescription(warningList)
            .setFooter({ text: `Toplam ${userWarnings.length} uyarı` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (commandName === 'temizle') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Bu komutu kullanmak için "Mesajları Yönet" yetkisine sahip olmalısınız!');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ 1 ile 100 arasında bir sayı belirtmelisiniz! Örnek: `b!temizle 10`');
        }

        try {
            const deleted = await message.channel.bulkDelete(amount + 1, true);
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🧹 Mesajlar Temizlendi')
                .setDescription(`${deleted.size - 1} mesaj silindi.`)
                .setTimestamp();

            const sent = await message.channel.send({ embeds: [embed] });
            setTimeout(() => sent.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error('Temizle hatası:', error);
            message.reply('❌ Mesajlar silinirken bir hata oluştu!');
        }
    }

    if (commandName === 'rol-ver') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ Bu komutu kullanmak için "Rolleri Yönet" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        const role = message.mentions.roles.first();

        if (!targetUser || !role) {
            return message.reply('❌ Bir kullanıcı ve rol etiketlemelisiniz! Örnek: `b!rol-ver @kullanıcı @rol`');
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        try {
            await targetMember.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Rol Verildi')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Rol', value: `${role.name}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Rol verme hatası:', error);
            message.reply('❌ Rol verilirken bir hata oluştu!');
        }
    }

    if (commandName === 'rol-al') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ Bu komutu kullanmak için "Rolleri Yönet" yetkisine sahip olmalısınız!');
        }

        const targetUser = message.mentions.users.first();
        const role = message.mentions.roles.first();

        if (!targetUser || !role) {
            return message.reply('❌ Bir kullanıcı ve rol etiketlemelisiniz! Örnek: `b!rol-al @kullanıcı @rol`');
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            return message.reply('❌ Bu kullanıcı sunucuda bulunamadı!');
        }

        try {
            await targetMember.roles.remove(role);
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Rol Alındı')
                .addFields(
                    { name: 'Kullanıcı', value: `${targetUser.tag}`, inline: true },
                    { name: 'Rol', value: `${role.name}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Rol alma hatası:', error);
            message.reply('❌ Rol alınırken bir hata oluştu!');
        }
    }
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Bot giriş hatası:', error);
    console.log('💡 .env dosyasında DISCORD_TOKEN ayarlandığından emin olun!');
});
