import {
    obtenirArticle,
    obtenirAvis,
    likerArticle,
    supprimerArticle,
    posterAvis,
    estConnecte,
    estProprietaire,
} from "./api.js";

const IMAGE_INDISPONIBLE =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#D8D3C7"/>
            <text x="200" y="155" font-family="sans-serif" font-size="18" fill="#55564F" text-anchor="middle">Image indisponible</text>
        </svg>`
    );

export async function initialiserDetail() {
    const parametres = new URLSearchParams(window.location.search);
    const id = parametres.get("id");

    const zoneDetail = document.querySelector("#zone-detail");
    const zoneListeAvis = document.querySelector("#liste-avis");

    if (!id) {
        zoneDetail.innerHTML = `<p class="message message-erreur">Article introuvable.</p>`;
        return;
    }

    try {
        const article = await obtenirArticle(id);
        afficherArticle(zoneDetail, article, id);
    } catch (erreur) {
        zoneDetail.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
        return; // Pas la peine de charger les avis si l'article n'existe pas.
    }

    try {
        const avis = await obtenirAvis(id);
        afficherListeAvis(zoneListeAvis, avis);
    } catch (erreur) {
        zoneListeAvis.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
    }

    initialiserFormulaireAvis(id);
}

/* ===== Affichage de l'article et de ses actions ===== */

function afficherArticle(zoneDetail, article, id) {
    const connecte = estConnecte();
    const proprietaire = connecte && estProprietaire(article);
    const utilisateurId = localStorage.getItem("userId");
    const dejaLike = connecte && Array.isArray(article.usersLiked) && article.usersLiked.includes(utilisateurId);

    zoneDetail.innerHTML = `
        <div class="detail-article">
            <img class="detail-image" src="${article.imageUrl}" alt="${article.title}">
            <div>
                <h1>${article.title}</h1>
                <p class="detail-prix">${article.price} €</p>
                <p>${article.description}</p>
                <div class="detail-actions" id="detail-actions"></div>
            </div>
        </div>
    `;

    const zoneActions = zoneDetail.querySelector("#detail-actions");
    zoneActions.innerHTML = construireActions(connecte, proprietaire, dejaLike, article.likes);
    attacherEvenementsActions(zoneActions, id, connecte, proprietaire);

    const image = zoneDetail.querySelector(".detail-image");
    image.addEventListener("error", () => { image.src = IMAGE_INDISPONIBLE; }, { once: true });
}

function construireActions(connecte, proprietaire, dejaLike, nombreLikes) {
    if (!connecte) {
        return `<p class="message message-info">Connecte-toi pour liker cet article ou laisser un avis. <a href="connexion.html">Se connecter</a></p>`;
    }

    let html = `
        <button id="bouton-like" class="bouton-like ${dejaLike ? "actif" : ""}" type="button">
            ♥ <span id="compteur-likes">${nombreLikes}</span>
        </button>
    `;

    if (proprietaire) {
        const parametres = new URLSearchParams(window.location.search);
        html += `<a href="creation.html?id=${parametres.get("id")}" class="bouton bouton-secondaire">Modifier</a>`;
        html += `<button id="bouton-supprimer" class="bouton bouton-danger" type="button">Supprimer</button>`;
    }

    return html;
}

function attacherEvenementsActions(zoneActions, id, connecte, proprietaire) {
    if (!connecte) return;

    const boutonLike = zoneActions.querySelector("#bouton-like");
    boutonLike.addEventListener("click", () => gererClicLike(boutonLike, id));

    if (proprietaire) {
        const boutonSupprimer = zoneActions.querySelector("#bouton-supprimer");
        boutonSupprimer.addEventListener("click", () => gererSuppression(boutonSupprimer, id));
    }
}

async function gererClicLike(boutonLike, id) {
    boutonLike.disabled = true;

    try {
        const articleMisAJour = await likerArticle(id);
        const utilisateurId = localStorage.getItem("userId");
        const dejaLike = Array.isArray(articleMisAJour.usersLiked) && articleMisAJour.usersLiked.includes(utilisateurId);

        boutonLike.querySelector("#compteur-likes").textContent = articleMisAJour.likes;
        boutonLike.classList.toggle("actif", dejaLike);
    } catch (erreur) {
        alert(erreur.message);
    }

    boutonLike.disabled = false;
}

async function gererSuppression(boutonSupprimer, id) {
    const confirmation = confirm("Supprimer définitivement cet article ? Cette action est irréversible.");
    if (!confirmation) return;

    boutonSupprimer.disabled = true;

    try {
        await supprimerArticle(id);
        window.location.href = "index.html";
    } catch (erreur) {
        alert(erreur.message);
        boutonSupprimer.disabled = false;
    }
}

/* ===== Avis ===== */

function afficherListeAvis(zoneListeAvis, avis) {
    if (!avis || avis.length === 0) {
        zoneListeAvis.innerHTML = `<p class="chargement">Aucun avis pour le moment. Sois le premier à en laisser un !</p>`;
        return;
    }

    zoneListeAvis.innerHTML = avis
        .map(
            (unAvis) => `
            <div class="avis-item">
                <p class="avis-commentaire">${unAvis.comment || ""}</p>
            </div>
        `
        )
        .join("");
}

function initialiserFormulaireAvis(id) {
    const zoneFormulaire = document.querySelector("#zone-formulaire-avis");

    if (!estConnecte()) {
        zoneFormulaire.innerHTML = "";
        return;
    }

    zoneFormulaire.innerHTML = `
        <h3>Laisser un avis</h3>
        <div id="zone-message-avis"></div>
        <form id="formulaire-avis" class="formulaire" novalidate>
            <div class="champ">
                <label for="commentaire">Commentaire</label>
                <textarea id="commentaire" required></textarea>
            </div>
            <button type="submit" class="bouton bouton-principal">Envoyer mon avis</button>
        </form>
    `;

    const formulaire = zoneFormulaire.querySelector("#formulaire-avis");
    formulaire.addEventListener("submit", (evenement) => gererEnvoiAvis(evenement, formulaire, id));
}

async function gererEnvoiAvis(evenement, formulaire, id) {
    evenement.preventDefault();

    const zoneMessage = formulaire.querySelector("#zone-message-avis") || document.querySelector("#zone-message-avis");
    const bouton = formulaire.querySelector("button[type='submit']");
    const commentaire = formulaire.querySelector("#commentaire").value.trim();

    bouton.disabled = true;

    try {
        await posterAvis({
            stuffId: id,
            comment: commentaire,
            user: localStorage.getItem("userId"),
        });
        formulaire.reset();
        const avisMisAJour = await obtenirAvis(id);
        afficherListeAvis(document.querySelector("#liste-avis"), avisMisAJour);
    } catch (erreur) {
        zoneMessage.innerHTML = `<p class="message message-erreur">${erreur.message}</p>`;
    }

    bouton.disabled = false;
}
