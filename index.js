const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
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

// Définition des commandes Slash
const commands = [
  // 1. Commande pour que les membres fassent un signalement détaillé
  new SlashCommandBuilder()
    .setName('signaler')
    .setDescription('Signaler un comportement suspect, un phishing ou un doxxing au staff'),

  // 2. Commande Tutoriel Pharos & Protocole d'action (Staff)
  new SlashCommandBuilder()
    .setName('signalement')
    .setDescription('Guide officiel Pharos et protocole d\'action de sécurité (Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  // 3. Commandes de modération de base (Ban, Kick, Timeout, Clear)
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un utilisateur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => option.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('Raison').setRequired(false)),

  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Met un membre en sourdine temporaire')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('membre').setDescription('Membre à mute').setRequired(true))
    .addIntegerOption(option => option.setName('duree').setDescription('Durée en minutes').setRequired(true))
    .addStringOption(option => option.setName('raison').setDescription('Raison').setRequired(false)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime des messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option => option.setName('nombre').setDescription('Nombre de messages (1-100)').setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`✅ Naxora Sécurité connecté : ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔄 Enregistrement des commandes...');
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
    // ==========================================
    // 1. GESTION DES COMMANDES SLASH (/)
    // ==========================================
    if (interaction.isChatInputCommand()) {
      
      // --- COMMANDE /signaler (Ouvre un formulaire pour le membre) ---
      if (interaction.commandName === 'signaler') {
        const modal = new ModalBuilder()
          .setCustomId('modal_signalement')
          .setTitle('🚨 Naxora - Formulaire de Signalement');

        const lienInput = new TextInputBuilder()
          .setCustomId('input_lien')
          .setLabel('Lien suspect, pseudo ou ID concerné')
          .setPlaceholder('Ex: https://discord.gg/... ou ID du suspect')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const descInput = new TextInputBuilder()
          .setCustomId('input_description')
          .setLabel('Détails du problème / de l\'infraction')
          .setPlaceholder('Explique ce qui s\'est passé en détail...')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(lienInput),
          new ActionRowBuilder().addComponents(descInput)
        );

        await interaction.showModal(modal);
      }

      // --- COMMANDE /signalement (Tutoriel Pharos & Protocole) ---
      else if (interaction.commandName === 'signalement') {
        const embed = new EmbedBuilder()
          .setColor('#FF3333')
          .setTitle('🛡️ Protocole de Sécurité & Tutoriel Pharos - Naxora')
          .setDescription('Ce guide détaille la marche à suivre pour le staff face aux infractions graves.')
          .addFields(
            { name: '🌐 Plateforme Officielle Pharos', value: '[Accéder au site officiel Pharos](https://www.internet-signalement.gouv.fr)' },
            { name: '📌 Quand agir / Comment réagir ?', value: '• **Phishing :** Demander de ne cliquer sur aucun lien, bannir le compte piraté si compromis.\n• **Doxxing / Harcèlement :** Faire des captures d\'écran, conserver les ID Discord, et rediriger vers Pharos ou la Direction.' },
            { name: '📋 Procédure Interne Staff', value: '1️⃣ Vérifier les informations reçues dans le salon de logs.\n2️⃣ Contacter la victime en privé si besoin.\n3️⃣ Isoler ou bannir l\'auteur de la menace.' }
          )
          .setFooter({ text: 'Naxora Security System' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // --- MODÉRATION CLASSIQUE (/ban, /timeout, /clear) ---
      else if (interaction.commandName === 'ban') {
        const user = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison') || 'Aucune raison';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

        await interaction.guild.members.ban(user, { reason });
        await interaction.reply({ content: `✅ **${user.tag}** a été banni.\n📝 Raison : ${reason}` });
      }

      else if (interaction.commandName === 'timeout') {
        const user = interaction.options.getUser('membre');
        const duree = interaction.options.getInteger('duree');
        const reason = interaction.options.getString('raison') || 'Aucune raison';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });

        await member.timeout(duree * 60 * 1000, reason);
        await interaction.reply({ content: `🔇 **${user.tag}** a été mute pour **${duree} minutes**.\n📝 Raison : ${reason}` });
      }

      else if (interaction.commandName === 'clear') {
        const nombre = interaction.options.getInteger('nombre');
        const deleted = await interaction.channel.bulkDelete(nombre, true);
        await interaction.reply({ content: `🧹 **${deleted.size}** messages supprimés.`, ephemeral: true });
      }
    }

    // ==========================================
    // 2. GESTION DU FORMULAIRE DE SIGNALEMENT
    // ==========================================
    else if (interaction.isModalSubmit() && interaction.customId === 'modal_signalement') {
      const lien = interaction.fields.getTextInputValue('input_lien') || 'Aucun lien fourni';
      const description = interaction.fields.getTextInputValue('input_description');
      const user = interaction.user;

      // Récupération du salon de logs configuré dans tes variables d'environnement
      const logsChannelId = process.env.LOGS_CHANNEL_ID;
      const logsChannel = interaction.guild.channels.cache.get(logsChannelId);

      // Embed qui sera envoyé dans le salon secret du staff
      const staffEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🚨 Nouveau Signalement Reçu !')
        .addFields(
          { name: '👤 Auteur du signalement', value: `${user} (\`@${user.username}\` - ID: ${user.id})`, inline: false },
          { name: '🔗 Lien / Suspect concerné', value: `\`\`\`${lien}\`\`\``, inline: false },
          { name: '📝 Description des faits', value: description, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Naxora Report System' });

      if (logsChannel) {
        await logsChannel.send({ embeds: [staffEmbed] });
        await interaction.reply({ 
          content: '✅ Ton signalement a bien été transmis à l\'équipe de modération de Naxora. Un membre du staff va l\'examiner rapidement.', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: '❌ Erreur de configuration : Le salon de logs staff (`LOGS_CHANNEL_ID`) est introuvable. Contacte un administrateur.', 
          ephemeral: true 
        });
      }
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
