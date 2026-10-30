const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes 
} = require('discord.js');

// ==========================================
// CONFIGURATION GLOBALE & MÉMOIRE EN LIGNE
// ==========================================
const TOKEN = process.env.DISCORD_TOKEN; 

// Paramètres configurables via les commandes du bot (valeurs par défaut)
let config = {
    categorieTicketsId: '1561309560189358081',
    roleStaffId: null // Rôle staff autorisé à gérer les tickets
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// PRÉPARATION ET LANCEMENT DU BOT
// ==========================================
client.once('ready', async () => {
    console.log(`✅ SecteurBot est en ligne sous le pseudo : ${client.user.tag}`);
    client.user.setActivity('SecteurBot | /setup-boutique');

    const commands = [
        {
            name: 'setup-boutique',
            description: 'Envoie le panneau officiel de la boutique SecteurBot.'
        },
        {
            name: 'setup-settings',
            description: 'Configure les paramètres du bot (rôle staff, catégorie des tickets).',
            options: [
                {
                    name: 'role_staff',
                    type: 8, // Type Role
                    description: 'Le rôle qui aura accès aux tickets',
                    required: true
                },
                {
                    name: 'categorie_id',
                    type: 3, // Type String
                    description: 'ID de la catégorie Discord pour ranger les tickets',
                    required: true
                }
            ]
        }
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log('🔄 Actualisation des Slash Commands (/) de SecteurBot...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Commandes enregistrées avec succès !');
    } catch (error) {
        console.error('❌ Erreur enregistrement commandes :', error);
    }
});

// ==========================================
// GESTION DES COMMANDES SLASH & INTERACTIONS
// ==========================================
client.on('interactionCreate', async (interaction) => {

    // 1. Commandes Slash (/setup-boutique et /setup-settings)
    if (interaction.isChatInputCommand()) {
        
        if (interaction.commandName === 'setup-boutique') {
            const embedBoutique = new EmbedBuilder()
                .setTitle('🛒 SECTEURBOT — BOUTIQUE OFFICIELLE & SERVICES')
                .setDescription('Bienvenue dans la boutique officielle **SecteurBot** !\nSélectionnez votre prestation dans le menu déroulant ci-dessous pour ouvrir un ticket et remplir votre formulaire de commande personnalisé.')
                .setColor('#7289da')
                .addFields(
                    { name: '📦 Pack Basique — 6 €', value: 'Structure de base, salons & rôles essentiels.', inline: false },
                    { name: '🚀 Pack Avancé — 13 €', value: 'Permissions poussées, sécurité & bots de modération.', inline: false },
                    { name: '⚡ Pack Pro — 21 €', value: 'Design complet, emojis, animations & sécurité maximale.', inline: false },
                    { name: '👑 Pack Entreprise — 32 €', value: 'Configuration sur-mesure d’un serveur complet.', inline: false },
                    { name: '🤖 Création de Bot — Sur Devis', value: 'Bot personnalisé selon vos besoins spécifiques.', inline: false }
                )
                .setFooter({ text: 'SecteurBot — Service Pro & Sécurisé' })
                .setTimestamp();

            // Menu déroulant professionnel avec choix des options
            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_pack')
                    .setPlaceholder('📂 Choisissez une option / un pack...')
                    .addOptions([
                        { label: 'Pack Basique (6 €)', description: 'Structure de base & salons essentiels', value: 'pack_basique', emoji: '📦' },
                        { label: 'Pack Avancé (13 €)', description: 'Sécurité & bots de modération', value: 'pack_avance', emoji: '🚀' },
                        { label: 'Pack Pro (21 €)', description: 'Design complet & animations max', value: 'pack_pro', emoji: '⚡' },
                        { label: 'Pack Entreprise (32 €)', description: 'Configuration sur-mesure complète', value: 'pack_entreprise', emoji: '👑' },
                        { label: 'Création de Bot (Sur Devis)', description: 'Bot personnalisé selon vos critères', value: 'pack_bot', emoji: '🤖' }
                    ])
            );

            await interaction.reply({ content: '✅ Panneau de la boutique généré avec succès !', ephemeral: true });
            await interaction.channel.send({ embeds: [embedBoutique], components: [menuRow] });
        }

        if (interaction.commandName === 'setup-settings') {
            // Vérification des permissions administrateur
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Vous devez être Administrateur pour utiliser cette commande.', ephemeral: true });
            }

            const role = interaction.options.getRole('role_staff');
            const catId = interaction.options.getString('categorie_id');

            config.roleStaffId = role.id;
            config.categorieTicketsId = catId;

            await interaction.reply({ 
                content: `⚙️ **Paramètres mis à jour avec succès !**\n• Rôle Staff des tickets : ${role}\n• ID Catégorie : \`${catId}\``, 
                ephemeral: true 
            });
        }
    }

    // 2. Gestion du Menu Déroulant (Ouverture du Formulaire / Modal)
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_pack') {
            const selectedValue = interaction.values[0];

            // Création du formulaire (Modal) personnalisé
            const modal = new ModalBuilder()
                .setCustomId(`modal_commande_${selectedValue}`)
                .setTitle('📋 Formulaire de Commande — SecteurBot');

            const projetInput = new TextInputBuilder()
                .setCustomId('projet_desc')
                .setLabel('Décrivez votre projet / vos attentes :')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Ex: Je souhaite un serveur communautaire axé gaming avec des salons propres...')
                .setRequired(true);

            const budgetInput = new TextInputBuilder()
                .setCustomId('projet_budget')
                .setLabel('Votre budget ou option choisie :')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: Pack Pro (21€)')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(projetInput),
                new ActionRowBuilder().addComponents(budgetInput)
            );

            await interaction.showModal(modal);
        }
    }

    // 3. Soumission du Formulaire (Création effective du ticket)
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('modal_commande_')) {
            const guild = interaction.guild;
            const user = interaction.user;
            const descriptionProjet = interaction.fields.getTextInputValue('projet_desc');
            const budgetInfo = interaction.fields.getTextInputValue('projet_budget');

            // Vérification d'un ticket existant
            const existingChannel = guild.channels.cache.find(
                c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
            );

            if (existingChannel) {
                return interaction.reply({ 
                    content: `❌ Vous avez déjà un ticket ouvert : ${existingChannel}`, 
                    ephemeral: true 
                });
            }

            // Construction des permissions du salon
            let overwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                }
            ];

            // Ajout du rôle staff s'il a été configuré
            if (config.roleStaffId) {
                overwrites.push({
                    id: config.roleStaffId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
                });
            }

            // Création du salon privé
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: config.categorieTicketsId,
                permissionOverwrites: overwrites
            });

            // Embed récapitulatif pour le staff et le client
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`🎫 Ticket de Commande — ${user.username}`)
                .setDescription(`Bonjour ${user} !\nUn membre de l'équipe **SecteurBot** va s'occuper de vous.\n\nVoici les détails transmis via votre formulaire :`)
                .setColor('#5865F2')
                .addFields(
                    { name: '📝 Description du projet', value: descriptionProjet, inline: false },
                    { name: '💰 Option / Budget', value: budgetInfo, inline: false }
                )
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('🛠️ Prendre en charge')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Fermer le ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            // Ping de l'utilisateur et du staff optionnel
            let pingContent = `${user}`;
            if (config.roleStaffId) pingContent += ` <@&${config.roleStaffId}>`;

            await ticketChannel.send({ content: pingContent, embeds: [ticketEmbed], components: [actionRow] });

            await interaction.reply({ 
                content: `✅ Votre ticket a été créé avec succès : ${ticketChannel}`, 
                ephemeral: true 
            });
        }
    }

    // 4. Gestion des boutons à l'intérieur du ticket (Prise en charge & Fermeture)
    if (interaction.isButton()) {
        if (interaction.customId === 'claim_ticket') {
            await interaction.reply({ 
                content: `🛠️ Ticket pris en charge par ${interaction.user}.` 
            });
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Fermeture du salon de ticket en cours...', ephemeral: true });
            setTimeout(() => interaction.channel.delete(), 4000);
        }
    }
});

client.login(TOKEN);
