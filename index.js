const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ChannelType,
    REST,
    Routes 
} = require('discord.js');

// ==========================================
// CONFIGURATION DES VARIABLES & IDENTIFIANTS
// ==========================================
const TOKEN = process.env.DISCORD_TOKEN; // Récupéré de manière sécurisée depuis ton hébergeur
const CATEGORIE_TICKETS_ID = '1561309560189358081'; // ID de ta catégorie pour les tickets

// Initialisation du client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// ÉVÉNEMENT : BOT PRÊT & ENREGISTREMENT DES SLASH COMMANDS
// ==========================================
client.once('ready', async () => {
    console.log(`✅ SecteurBot est en ligne sous le pseudo : ${client.user.tag}`);
    client.user.setActivity('SecteurBot | /setup-boutique');

    // Définition de la Slash Command /setup-boutique
    const commands = [
        {
            name: 'setup-boutique',
            description: 'Envoie le panneau officiel de la boutique SecteurBot et les tickets.'
        }
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log('🔄 Actualisation des Slash Commands (/) du bot...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Les Slash Commands (/) ont été enregistrées avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes :', error);
    }
});

// ==========================================
// GESTION DES COMMANDES SLASH ET INTERACTIONS
// ==========================================
client.on('interactionCreate', async (interaction) => {
    
    // --- 1. Gestion des Slash Commands (ex: /setup-boutique) ---
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup-boutique') {
            
            // Création de l'embed de la boutique
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

            // Création du bouton interactif attaché au message
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('📩 Commander / Ouvrir un Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            // Réponse visible uniquement par l'admin ou envoyée dans le salon
            await interaction.reply({ content: '✅ Panneau de la boutique généré avec succès !', ephemeral: true });
            await interaction.channel.send({ embeds: [embedBoutique], components: [row] });
        }
    }

    // --- 2. Gestion des Boutons (Tickets) ---
    if (interaction.isButton()) {
        
        // Clic sur "Ouvrir un ticket"
        if (interaction.customId === 'open_ticket') {
            const guild = interaction.guild;
            const user = interaction.user;

            // Vérification si un ticket existe déjà pour cet utilisateur
            const existingChannel = guild.channels.cache.find(
                c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            );

            if (existingChannel) {
                return interaction.reply({ 
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingChannel}`, 
                    ephemeral: true 
                });
            }

            // Création automatique du salon textuel privé
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: CATEGORIE_TICKETS_ID,
                permissionOverwrites: [
                    {
                        id: guild.id, // Cache le salon à tout le monde par défaut
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id, // Donne l'accès uniquement au client
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                    }
                ]
            });

            // Embed envoyé à l'intérieur du ticket
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

            // Confirmation discrète pour l'utilisateur
            await interaction.reply({ 
                content: `✅ Votre ticket a été créé avec succès : ${ticketChannel}`, 
                ephemeral: true 
            });
        }

        // Clic sur "Fermer le ticket"
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Fermeture du salon de ticket en cours...', ephemeral: true });
            setTimeout(() => interaction.channel.delete(), 4000);
        }
    }
});

// ==========================================
// CONNEXION DU BOT AU SERVEUR DISCORD
// ==========================================
client.login(TOKEN);
