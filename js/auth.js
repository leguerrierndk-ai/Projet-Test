import { connecter, inscrire } from "./api.js";

export function initialiserFormulaireConnexion() {
    afficherMessageSessionExpiree();

    const formulaire = document.querySelector("#formulaire-connexion");
    const zoneMessage = document.querySelector("#zone-message");
    const boutonEnvoyer = formulaire.querySelector("button[type='submit']");

    formulaire.addEventListener("submit", async (evenement) => {
        evenement.preventDefault();
        viderMessage(zoneMessage);

        const email = formulaire.querySelector("#email").value.trim();
        const motDePasse = formulaire.querySelector("#motDePasse").value;

        basculerChargement(boutonEnvoyer, true, "Connexion...");

        try {
            const reponse = await connecter(email, motDePasse);
            localStorage.setItem("token", reponse.token);
            localStorage.setItem("userId", reponse.userId);
            window.location.href = "index.html";
        } catch (erreur) {
            afficherMessage(zoneMessage, erreur.message, "erreur");
            basculerChargement(boutonEnvoyer, false, "Se connecter");
        }
    });
}

export function initialiserFormulaireInscription() {
    const formulaire = document.querySelector("#formulaire-inscription");
    const zoneMessage = document.querySelector("#zone-message");
    const boutonEnvoyer = formulaire.querySelector("button[type='submit']");

    formulaire.addEventListener("submit", async (evenement) => {
        evenement.preventDefault();
        viderMessage(zoneMessage);

        const email = formulaire.querySelector("#email").value.trim();
        const motDePasse = formulaire.querySelector("#motDePasse").value;
        const confirmation = formulaire.querySelector("#confirmation").value;

        if (motDePasse !== confirmation) {
            afficherMessage(zoneMessage, "Les mots de passe ne correspondent pas.", "erreur");
            return;
        }

        basculerChargement(boutonEnvoyer, true, "Création...");

        try {
            await inscrire(email, motDePasse);
            window.location.href = "connexion.html?raison=compte-cree";
        } catch (erreur) {
            afficherMessage(zoneMessage, erreur.message, "erreur");
            basculerChargement(boutonEnvoyer, false, "Créer mon compte");
        }
    });
}

/* ===== Fonctions utilitaires internes ===== */

function afficherMessageSessionExpiree() {
    const parametres = new URLSearchParams(window.location.search);
    const raison = parametres.get("raison");
    const zoneMessage = document.querySelector("#zone-message");

    if (raison === "session-expiree") {
        afficherMessage(zoneMessage, "Ta session a expiré, reconnecte-toi.", "info");
    } else if (raison === "compte-cree") {
        afficherMessage(zoneMessage, "Compte créé ! Tu peux maintenant te connecter.", "succes");
    }
}

function afficherMessage(zoneMessage, texte, type) {
    zoneMessage.innerHTML = `<p class="message message-${type}">${texte}</p>`;
}

function viderMessage(zoneMessage) {
    zoneMessage.innerHTML = "";
}

function basculerChargement(bouton, enCours, texte) {
    bouton.disabled = enCours;
    bouton.textContent = texte;
}
