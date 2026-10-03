import {
    obtenirArticle,
    creerArticle,
    modifierArticle,
    estConnecte,
    estProprietaire,
} from "./api.js";

export async function initialiserCreation() {
    if (!estConnecte()) {
        window.location.href = "connexion.html";
        return;
    }

    const parametres = new URLSearchParams(window.location.search);
    const id = parametres.get("id");
    const modeModification = Boolean(id);

    const titrePage = document.querySelector("#titre-page");
    const formulaire = document.querySelector("#formulaire-article");
    const zoneMessage = document.querySelector("#zone-message");

    if (modeModification) {
        titrePage.textContent = "Modifier mon annonce";

        try {
            const article = await obtenirArticle(id);

            if (!estProprietaire(article)) {
                formulaire.remove();
                zoneMessage.innerHTML = `<p class="message message-erreur">Tu ne peux modifier que tes propres annonces.</p>`;
                return;
            }

            preRemplirFormulaire(formulaire, article);
        } catch (erreur) {
            formulaire.remove();
            zoneMessage.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
            return;
        }
    } else {
        titrePage.textContent = "Déposer une annonce";
    }

    formulaire.addEventListener("submit", (evenement) =>
        gererEnvoi(evenement, formulaire, zoneMessage, id)
    );
}

function preRemplirFormulaire(formulaire, article) {
    formulaire.querySelector("#titre").value = article.title;
    formulaire.querySelector("#description").value = article.description;
    formulaire.querySelector("#imageUrl").value = article.imageUrl;
    formulaire.querySelector("#prix").value = article.price;
}

async function gererEnvoi(evenement, formulaire, zoneMessage, id) {
    evenement.preventDefault();
    zoneMessage.innerHTML = "";

    const donnees = {
        title: formulaire.querySelector("#titre").value.trim(),
        description: formulaire.querySelector("#description").value.trim(),
        imageUrl: formulaire.querySelector("#imageUrl").value.trim(),
        price: Number(formulaire.querySelector("#prix").value),
    };

    const bouton = formulaire.querySelector("button[type='submit']");
    bouton.disabled = true;
    bouton.textContent = "Enregistrement...";

    try {
        if (id) {
            await modifierArticle(id, donnees);
            window.location.href = `detail.html?id=${id}`;
        } else {
            const reponse = await creerArticle(donnees);
            // Selon l'API, la création peut renvoyer soit l'article créé
            // (avec un _id), soit juste un message de confirmation.
            const nouvelId = reponse && (reponse._id || reponse.id);
            window.location.href = nouvelId ? `detail.html?id=${nouvelId}` : "index.html";
        }
    } catch (erreur) {
        zoneMessage.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
        bouton.disabled = false;
        bouton.textContent = id ? "Enregistrer les modifications" : "Publier l'annonce";
    }
}
