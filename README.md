# S.M.B-Project

# Description

Proposition d'une solution permettant le transfert de fichiers chiffrés de bout en bout.  
Nous proposons ici une solution utilisant les langages WEB, nodeJS, expressJS, et les services de stockages MARIADB et web3js

Projet du Mastercamp 2022 réalisé dans le cadre de la fillière sécurité & réseau.
Réalisé par l'équipe S.M.B. :
  - Keenan BARANÈS
  - Adrien CAILLOT
  - Maxence CERFONTAINE
  - Douhaou Audrey Arielle GONDO
  - Zakaria KABACHE
  - Thibault LOTH
  
# Architecture

# Installation et exécution
1)Téléchargez le zip du site à partir de github.   
2)Décompresser le fichier dans un dossier.  
3)Lancer Visual Studio Code et assurer vous d'avoir NODE et npm d'installés sur votre ordinateur (Suivre ce lien si node n'est pas installé : https://nodejs.org/en/)  
4)Ouvrir avec VSC le dossier ou votre site est décompressé.  
5)Installer imcrypt avec la commande npm install imcrypt (dans le dossier où le site est stocké)  
6)Installer QPDF (suivre les premières minutes de cette vidéo : https://www.youtube.com/watch?v=b9gCULt-OV0  
6.5) Videz les dossiers downloaded, encrypted,uploads & FinalFiles  
7)Ouvrir un terminal VSC et taper la commande : "npm start"    
8)Rendez vous sur ce lien : http://localhost:3000/log/sign    
9)Testez !  

# Bugs Connus
Voici une liste de bugs connus sur le site. Cette liste se mettra à jour au fur et à mesure des découvertes :  
- Seuls les fichiers .txt, .png, .jpg et .pdf sont traités actuellement (04/07/2022)
- Les fichiers ne doivent pas avoir d'espace dans leurs noms
- La page de login peut de temps en temps dysfonctionner ammenant une erreur : *ERR_HTTP_HEADERS_SENT*
- Bug sur le chiffrage des .jpg (04/07/2022)
- Le déchiffrage des .txt ne fonctionne pas
- Le téléchargement des fichiers peut être un peu long (Se référrer à la console avec lequel vous avez lancer le site, appuyer sur Entrée pour la rafraichr)
- Déchiffrer plusieurs fichiers à la fois ne fonctionne pas
