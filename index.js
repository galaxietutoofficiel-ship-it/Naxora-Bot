const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');

// ⚙️ TES CONFIGURATIONS (À remplacer par tes vrais ID)
const ID_ROLE_STAFF = 'ID_DU_ROLE_STAFF'; 
const ID_CATEGORIE_TICKETS = 'ID_DE_LA_CATEGORIE'; 

module.exports = {
  // =================================================================
  // 1. COMMANDE /signalement (Tutoriel Pharos pour le Staff)
  // =================================================================
  signalementCommand: {
    data: new SlashCommandBuilder()
      .setName('signalement')
      .setDescription('Tutoriel rapide et lien officiel pour Pharos (Staff uniquement)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
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
  },

  // =================================================================
  // 2. COMMANDE /setup-ticket (Déploie le Panel avec Menu Déroulant)
  // =================================================================
  setupTicketCommand: {
    data: new SlashCommandBuilder()
      .setName('setup-ticket')
      .setDescription('Déploie le panel de création de tickets')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
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
      await interaction.reply({ content: '✅ Panel de ticket déployé avec succès !', ephemeral: true });
    }
  },

  // =================================================================
  // 3. GESTIONNAIRE D'ÉVÉNEMENTS (Création de salon + Boutons Sécurisés)
  // =================================================================
  handleInteractions: async function(interaction) {
    // Clic sur le menu déroulant du panel
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
      const type = interaction.values[0];
      const guild = interaction.guild;
      const user = interaction.user;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: ID_CATEGORIE_TICKETS,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
          { id: ID_ROLE_STAFF, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
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

      await ticketChannel.send({ content: `${user} | <@&${ID_ROLE_STAFF}>`, embeds: [embedMsg], components: [boutonsStaff] });
    }

    // Clic sur les boutons de gestion du ticket
    if (interaction.isButton()) {
      const estStaff = interaction.member.roles.cache.has(ID_ROLE_STAFF);

      // Sécurité : Seul le staff peut utiliser les boutons
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
        await interaction.reply({ content: '💡 Pour ajouter un membre, tapez la commande d\'ajout dans ce salon.', ephemeral: true });
      }
    }
  }
};
