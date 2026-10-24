const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Définition des commandes Slash (/)
const commands = [
    new SlashCommandBuilder()
        .setName('securite')
        .setDescription('Affiche des conseils et bonnes pratiques de cybersécurité.'),
        
    new SlashCommandBuilder()
        .setName('assistance')
        .setDescription('Obtenir de l\'aide d\'urgence en cas de doute ou de piratage.'),
        
    new SlashCommandBuilder()
        .setName('signaler')
        .setDescription('Signaler une arnaque, un lien suspect ou un utilisateur louche.')
        .addStringOption(option => 
            option.setName('details')
                .setDescription('Explique le problème ou colle le lien suspect')
                .setRequired(true))
].map(command => command.toJSON());

// Enregistrement des commandes Slash auprès de Discord à l'allumage
client.once('ready', async () => {
    console.log(`[NAXORA] Bot connecté en tant que ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('[NAXORA] Enregistrement des commandes Slash (/)...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('[NAXORA] Commandes Slash enregistrées avec succès !');
    } catch (error) {
        console.error('[NAXORA] Erreur d\'enregistrement des commandes :', error);
    }
});

// Gestion des interactions (Slash Commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // --- COMMANDE /SECURITE ---
    if (commandName === 'securite') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Hub de Sécurité Naxora')
            .setDescription('Voici les règles d\'or pour naviguer en toute sécurité sur Internet et Discord :')
            .setColor(0x0099FF)
            .addFields(
                { name: '🎣 Phishing / Hameçonnage', value: 'Vérifie toujours l\'adresse exacte d\'un site. Ne clique pas sur des liens promettant du Nitro gratuit.' },
                { name: '🔑 Mots de passe', value: 'Utilise un mot de passe unique par service et active l\'authentification à deux facteurs (2FA).' },
                { name: '📱 Applications', value: 'Ne télécharge pas de fichiers `.exe` ou `.apk` suspects venant de messages privés.' }
            )
            .setFooter({ text: 'Naxora • Protection & Cybersécurité' });

        await interaction.reply({ embeds: [embed] });
    }

    // --- COMMANDE /ASSISTANCE ---
    if (commandName === 'assistance') {
        const embed = new EmbedBuilder()
            .setTitle('🚨 Assistance Cybersécurité Naxora')
            .setDescription('Tu penses que ton compte ou ton appareil a été compromis ?')
            .setColor(0xFF0000)
            .addFields(
                { name: '1. Change immédiatement tes mots de passe', value: 'Commence par ton e-mail principal, puis Discord et tes réseaux.' },
                { name: '2. Révoque les sessions actives', value: 'Sur Discord : Paramètres > Appareils > Déconnecter toutes les sessions inconnues.' },
                { name: '3. Contacte l\'équipe Naxora', value: 'Ouvre un ticket ou mentionne un modérateur dans le salon d\'entraide.' }
            )
            .setFooter({ text: 'Naxora • Toujours là pour t\'aider' });

        await interaction.reply({ embeds: [embed], ephemeral: true }); // visible uniquement par l'utilisateur
    }

    // --- COMMANDE /SIGNALER ---
    if (commandName === 'signaler') {
        const details = interaction.options.getString('details');

        const embedConfirmation = new EmbedBuilder()
            .setTitle('✅ Signalement reçu')
            .setDescription('Merci ! Ton signalement a été transmis à l\'équipe de sécurité Naxora.')
            .setColor(0x00FF00)
            .addFields({ name: 'Détails transmis', value: details })
            .setFooter({ text: 'Naxora Security' });

        // Réponse discrète pour la personne qui signale
        await interaction.reply({ embeds: [embedConfirmation], ephemeral: true });
    }
});

// Connexion du bot
client.login(process.env.TOKEN);
