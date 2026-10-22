# Decentralized Electronic Voting System

Demo de systeme de vote electronique decentralise construit avec Solidity et Hardhat.

**Objectif** : garantir la transparence des votes et empecher un electeur de voter plusieurs fois.

> **Point important** : sur une blockchain publique, les votes et les interactions peuvent etre
> observables. Ce systeme de demonstration ne garantit donc pas, a lui seul, le secret du vote ni
> la securite d'une veritable election nationale. Un vrai deploiement en conditions reelles
> necessiterait des mecanismes additionnels (preuves a divulgation nulle de connaissance,
> chiffrement homomorphe, identite decentralisee verifiee, etc.) hors du perimetre de cette demo.

## Architecture

| Contrat | Role |
|---|---|
| `VoterRegistry.sol` | Enregistre les adresses des electeurs autorises par l'administrateur. |
| `ElectionManager.sol` | Cree les elections, definit les candidats et les dates d'ouverture/cloture. |
| `Voting.sol` | Enregistre les votes, verifie l'autorisation et empeche un meme electeur de voter deux fois. |
| `Results.sol` | Calcule et publie les resultats une fois le scrutin cloture. |

```
VoterRegistry  <---+
                    |
ElectionManager <---+--- Voting ---+--- Results
```

`Voting` lit `VoterRegistry` (autorisation) et `ElectionManager` (fenetre de vote, liste des
candidats). `Results` lit `ElectionManager` (date de cloture) et `Voting` (nombre de votes) pour
calculer les resultats, sans jamais modifier l'etat des votes.

## Fonctionnement

1. L'administrateur deploie les quatre contrats puis enregistre les electeurs autorises
   (`VoterRegistry.registerVoter` / `registerVoters`).
2. L'administrateur cree une election (`ElectionManager.createElection`) avec un nom, une liste
   de candidats et une fenetre `startTime` / `endTime`.
3. Pendant la fenetre de vote, chaque electeur enregistre appelle `Voting.vote(electionId,
   candidateId)`. Le contrat refuse tout electeur non enregistre, tout vote hors fenetre, et tout
   second vote du meme electeur.
4. Apres la cloture (`block.timestamp >= endTime`), n'importe qui peut consulter
   `Results.getResults` / `Results.getWinner`, ou appeler `Results.publishResults` pour emettre un
   evenement `ResultsPublished` exploitable par une UI ou un indexeur.

## Structure du projet

```
contracts/          Contrats Solidity (VoterRegistry, ElectionManager, Voting, Results)
test/                Tests Hardhat/Mocha/Chai pour chaque contrat
scripts/deploy.js     Script de deploiement des 4 contrats, dans l'ordre de dependance
frontend/             Demo statique (HTML/JS + ethers.js) pour interagir via MetaMask
```

## Prerequis

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Compiler et tester

```bash
npm run compile
npm test
```

## Deployer en local

```bash
# Terminal 1 : lance un noeud Hardhat local
npm run node

# Terminal 2 : deploie les contrats sur ce noeud
npm run deploy:local
```

Le script affiche les adresses des quatre contrats deployes. Copiez-les dans
`frontend/config.js`.

## Utiliser la demo frontend

1. Renseignez les adresses deployees dans `frontend/config.js`.
2. Configurez MetaMask sur le reseau local Hardhat (RPC `http://127.0.0.1:8545`, chainId `31337`)
   et importez un des comptes affiches par `npm run node` (le premier compte est l'administrateur
   des contrats).
3. Ouvrez `frontend/index.html` (par exemple via `npx http-server frontend`).
4. Connectez le wallet, enregistrez des electeurs, creez une election, votez puis consultez les
   resultats apres la cloture.

## Limites connues (demo pedagogique)

- Les votes sont publics sur la blockchain : n'importe qui peut observer quel candidat un
  electeur a choisi en lisant l'evenement `VoteCast` ou l'etat du contrat.
- L'enregistrement des electeurs repose sur un administrateur unique (`onlyAdmin`), ce qui est un
  point de centralisation et de confiance explicite.
- Aucun mecanisme d'identite ne verifie qu'une adresse correspond a une personne physique unique.
- `Results.getWinner` rejette une egalite stricte plutot que de la resoudre arbitrairement.
