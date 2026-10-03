// Composant header partagé par toutes les pages.
// Injecté en JavaScript (plutôt que dupliqué en HTML) pour n'avoir
// qu'un seul endroit à modifier, et pour refléter l'état de connexion
// sans dépendre d'un serveur (fetch d'un fichier .html séparé
// échouerait si le projet est ouvert directement, sans Live Server).

export function afficherEntete() {
    const conteneurEntete = document.querySelector("#entete");
    if (!conteneurEntete) return;

    const token = localStorage.getItem("token");
    const estConnecte = Boolean(token);

    conteneurEntete.innerHTML = `
        <div class="conteneur entete-barre">
            <a href="index.html" class="entete-logo">Stuff</a>
            <div class="entete-actions">
                ${estConnecte ? blocConnecte() : blocDeconnecte()}
            </div>
        </div>
    `;

    if (estConnecte) {
        const boutonDeconnexion = conteneurEntete.querySelector("#bouton-deconnexion");
        boutonDeconnexion.addEventListener("click", deconnecter);
    }
}

function blocConnecte() {
    return `
        <span class="statut-connexion">Connecté</span>
        <a href="creation.html" class="bouton bouton-secondaire">Déposer une annonce</a>
        <button id="bouton-deconnexion" class="bouton bouton-danger" type="button">Déconnexion</button>
    `;
}

function blocDeconnecte() {
    return `
        <a href="connexion.html" class="bouton bouton-secondaire">Connexion</a>
        <a href="inscription.html" class="bouton bouton-principal">Créer un compte</a>
    `;
}

function deconnecter() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "index.html";
}
