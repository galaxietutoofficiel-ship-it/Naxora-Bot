const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ChannelType 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Remplace par ton TOKEN Discord et l'ID de la catégorie où créer les tickets
const TOKEN = 'TON_TOKEN_DE_BOT_ICI';
const CATEGORIE_TICKETS_ID = 'ID_DE_TA_CATEGORIE_TICKETS';

client.once('ready', () => {
    console.log(`✅ SecteurBot est en ligne sous le pseudo : ${client.user.tag}`);
    client.user.setActivity('SecteurBot | Vos serveurs sur-mesure');
});

// Commande pour envoyer le panneau de boutique & tickets
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup-boutique') {
        // Supprime le message de commande
        if (message.deletable) message.delete();

        const embedBoutique = new EmbedBuilder()
            .setTitle('🛒 SECTEURBOT — BOUTIQUE OFFICIELLE')
            .setDescription('Bienvenue dans la boutique officielle **SecteurBot** !\nSélectionnez une prestation ci-dessous ou ouvrez un ticket pour passer commande.')
            .setColor('#7289da')
            .addFields(
                { name: '📦 Pack Basique — 6 €', value: 'Structure de base, salons & rôles essentiels.', inline: false },
                { name: '🚀 Pack Avancé — 13 €', value: 'Permissions poussées, sécurité & bots de modération.', inline: false },
                { name: '⚡ Pack Pro — 21 €', value: 'Design complet, emojis, animations & sécurité maximale.', inline: false },
                { name: '👑 Pack Entreprise — 32 €', value: 'Configuration sur-mesure d’un serveur communautaire ou business complet.', inline: false },
                { name: '🤖 Creation de Bot — Sur Devis', value: 'Bot personnalisé selon vos besoins spécifiques.', inline: false }
            )
            .setFooter({ text: 'SecteurBot — Service Pro & Sécurisé' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('📩 Commander / Ouvrir un Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embedBoutique], components: [row] });
    }
});

// Gestion des interactions (Clic sur le bouton de ticket)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        // Vérification si un ticket existe déjà
        const existingChannel = guild.channels.cache.find(
            c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        );

        if (existingChannel) {
            return interaction.reply({ 
                content: `❌ Vous avez déjà un ticket ouvert : ${existingChannel}`, 
                ephemeral: true 
            });
        }

        // Création du salon de ticket
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: ChannelType.GuildText,
            parent: CATEGORIE_TICKETS_ID,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                }
            ]
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 Ticket de ${user.username}`)
            .setDescription(`Bonjour ${user} !\nUn membre de l’équipe **SecteurBot** va vous prendre en charge sous peu.\n\nMerci de préciser :\n• Le service souhaité (Basique, Avancé, Pro, Entreprise ou Bot)\n• Vos besoins spécifiques`)
            .setColor('#5865F2')
            .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Fermer le ticket')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: `${user}`, embeds: [ticketEmbed], components: [closeRow] });

        await interaction.reply({ 
            content: `✅ Votre ticket a été créé : ${ticketChannel}`, 
            ephemeral: true 
        });
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Fermeture du ticket dans 5 secondes...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

client.login(TOKEN);
