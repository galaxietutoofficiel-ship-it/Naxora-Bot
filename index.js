const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Stockage des configurations de tickets par serveur
const ticketConfigs = new Map();

// Définition des commandes
const commands = [
  new SlashCommandBuilder()
    .setName('signalement')
    .setDescription('Tutoriel rapide et lien officiel pour Pharos (Staff uniquement)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('setup-ticket')
    .setDescription('Déploie le panel et configure ton rôle staff et ta catégorie en un clic !')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option => 
      option.setName('role_staff')
        .setDescription('Choisis le rôle qui aura accès aux tickets')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('categorie')
        .setDescription('Choisis la catégorie où créer les salons de tickets')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  // Utilisation automatique du token de l'environnement de Bot-Hosting
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔄 Enregistrement des commandes...');
    // S'enregistre tout seul avec l'ID du bot connecté
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('✨ Commandes enregistrées avec succès !');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    // 1. Gestion des Slash Commandes
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'signalement') {
        const embed = new EmbedBuilder()
          .setColor('#FF3333')
          .setTitle('🚨 Tutoriel Signalement Pharos - Staff Naxora')
          .setDescription('Ce guide t\'aide à effectuer un signalement officiel ou à préparer le dossier pour la Direction.')
          .addFields(
            { name: '🌐 Site Officiel Pharos', value: '[Accéder à la plateforme Pharos](https://www.internet-signalement.gouv.fr)' },
            { name: '📌 Quand signaler ?', value: '• Phishing / Vol de compte\n• Doxxing (divulgation de données privées)\n• Cyberharcèlement grave.' },
            { name: '📋 Procédure :', value: '1️⃣ Fais des captures d\'écran.\n2️⃣ Copie l\'ID Discord de l\'auteur.\n3️⃣ Fais le signalement ou transmets tout à la Direction.' }
          )
          .setFooter({ text: 'Naxora Security System' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } 
      else if (interaction.commandName === 'setup-ticket') {
        const roleStaff = interaction.options.getRole('role_staff');
        const categorie = interaction.options.getChannel('categorie');

        ticketConfigs.set(interaction.guildId, {
          roleId: roleStaff.id,
          categoryId: categorie.id
        });

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🎫 Centre de Support & Assistance - Naxora')
          .setDescription('Besoin d\'aide ou envie de signaler une infraction ? Sélectionnez la catégorie ci-dessous.')
          .addFields(
            { name: '🛡️ Sécurité & Phishing', value: 'Liens suspects, fausses offres, vols de compte.' },
            { name: '🔍 Doxxing & Intimidation', value: 'Divulgation de vos données privées ou harcèlement.' },
            { name: '❓ Question / Aide Générale', value: 'Pour toute demande d\'information globale.' }
          )
          .setFooter({ text: 'Un salon privé sera automatiquement créé avec l\'équipe.' });

        const menu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select_ticket_type')
            .setPlaceholder('👉 Choisissez le motif de votre ticket...')
            .addOptions([
              { label: 'Sécurité & Phishing', description: 'Signaler un lien frauduleux ou un piratage', value: 'ticket_phishing', emoji: '🛡️' },
              { label: 'Doxxing & Fuite d\'infos', description: 'Signaler des menaces ou la fuite de données', value: 'ticket_doxx', emoji: '🔍' },
              { label: 'Question / Support', description: 'Besoin d\'aide générale sur le serveur', value: 'ticket_general', emoji: '❓' },
            ])
        );

        await interaction.channel.send({ embeds: [embed], components: [menu] });
        await interaction.reply({ 
          content: `✅ Panel déployé avec succès !\n🛡️ Rôle staff autorisé : **@${roleStaff.name}**\n📂 Catégorie : **${categorie.name}**`, 
          ephemeral: true 
        });
      }
    }

    // 2. Création du salon de ticket via le menu déroulant
    else if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
      const config = ticketConfigs.get(interaction.guildId);
      if (!config) {
        return interaction.reply({ content: '❌ Tu dois d\'abord configurer le panel en tapant `/setup-ticket` sur ce serveur.', ephemeral: true });
      }

      const type = interaction.values[0];
      const guild = interaction.guild;
      const user = interaction.user;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
          { id: config.roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
        ],
      });

      await interaction.reply({ content: `✅ Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });

      const boutonsStaff = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_fermer').setLabel('🔒 Fermer').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_transcript').setLabel('📜 Transcrire & Fermer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_ajouter_membre').setLabel('➕ Ajouter un membre').setStyle(ButtonStyle.Secondary)
      );

      let embedMsg = new EmbedBuilder().setColor('#5865F2');
      if (type === 'ticket_phishing' || type === 'ticket_doxx') {
        embedMsg.setTitle('🚨 Ticket Urgent - Sécurité / Doxx')
                .setDescription(`Bonjour ${user}, un assistant Naxora arrive.\n\n📌 **À fournir :**\n1️⃣ Captures d'écran\n2️⃣ ID Discord du suspect\n3️⃣ Ne cliquez sur aucun lien !`);
      } else {
        embedMsg.setTitle('❓ Ticket Support Général')
                .setDescription(`Bonjour ${user}, posez votre question ci-dessous.`);
      }

      await ticketChannel.send({ content: `${user} | <@&${config.roleId}>`, embeds: [embedMsg], components: [boutonsStaff] });
    }

    // 3. Gestion des boutons du staff
    else if (interaction.isButton()) {
      const config = ticketConfigs.get(interaction.guildId);
      const estStaff = config && interaction.member.roles.cache.has(config.roleId);

      if (!estStaff) {
        return interaction.reply({ content: '❌ **Accès refusé :** Réservé exclusivement au staff Naxora.', ephemeral: true });
      }

      if (interaction.customId === 'btn_fermer') {
        await interaction.reply('🔒 Fermeture du ticket dans 5 secondes...');
        setTimeout(() => interaction.channel.delete(), 5000);
      }

      if (interaction.customId === 'btn_transcript') {
        await interaction.reply('📜 Récupération des messages...');
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const contenuText = messages.map(m => `[${m.createdAt.toLocaleString('fr-FR')}] ${m.author.tag}: ${m.content}`).reverse().join('\n');

        const buffer = Buffer.from(contenuText, 'utf-8');
        await interaction.channel.send({
          content: '📑 **Transcript du ticket :**',
          files: [{ attachment: buffer, name: `transcript-${interaction.channel.name}.txt` }]
        });

        await interaction.followUp('🔒 Suppression du salon dans 10 secondes.');
        setTimeout(() => interaction.channel.delete(), 10000);
      }

      if (interaction.customId === 'btn_ajouter_membre') {
        await interaction.reply({ content: '💡 Pour ajouter un membre, gère les permissions du salon directement sur Discord.', ephemeral: true });
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// Connexion via la variable d'environnement de Bot-Hosting
client.login(process.env.TOKEN);
