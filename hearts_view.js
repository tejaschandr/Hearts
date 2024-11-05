// import { HeartsRobotKMP } from "./hearts_robot_kmp.js";
import { HeartsRobotCustom } from "./hearts_robot_custom.js";
import { HU } from "./hearts_utils.js";

export class HeartsView {
    #model;
    #controller;
    #mainDiv;
    #gameState;
    #playerHands;
    #currentTrick;
    #scoreBoard;
    #messageArea;
    #passCardsArea;
    #selectedCards;
    #currentRound;
    #cardSelectSound;

    constructor(model, controller) {
        this.#model = model;
        this.#controller = controller;
        this.#selectedCards = [];
        this.#playerHands = {};
        this.#currentRound = 0;

        this.#cardSelectSound = new Audio('sounds/card-sound.mp3');

        this.#model.addEventListener('stateupdate', () => this.#handleStateUpdate());
        this.#model.addEventListener('trickstart', () => this.#handleTrickStart());
        this.#model.addEventListener('trickplay', (e) => this.#handleTrickPlay(e));
        this.#model.addEventListener('trickcollected', (e) => this.#handleTrickCollected(e));
        this.#model.addEventListener('scoreupdate', (e) => this.#handleScoreUpdate(e));
    }

    render(renderDiv) {
        this.#mainDiv = renderDiv;
        this.#mainDiv.innerHTML = `
            <div id="gameArea">
                <div id="scoreBoard"></div>
                <div id="topHand" class="opponentHand"></div>
                <div id="middleRow">
                    <div id="leftHand" class="opponentHand"></div>
                    <div id="centerArea">
                        <div id="messageArea"></div>
                        <div id="currentTrick"></div>
                    </div>
                    <div id="rightHand" class="opponentHand"></div>
                </div>
                <div id="bottomHand" class="playerHand"></div>
                <div id="passCardsArea"></div>
            </div>
        `;

        this.#gameState = document.getElementById('messageArea');
        this.#playerHands = {
            north: document.getElementById('topHand'),
            west: document.getElementById('leftHand'),
            east: document.getElementById('rightHand'),
            south: document.getElementById('bottomHand')
        };
        this.#currentTrick = document.getElementById('currentTrick');
        this.#scoreBoard = document.getElementById('scoreBoard');
        this.#messageArea = document.getElementById('messageArea');
        this.#passCardsArea = document.getElementById('passCardsArea');

        this.#startGame();
    }

    #startGame() {
        const playerName = prompt("Enter your name:", "Player");
        const robots = ['north', 'east', 'west'].map(position => 
            new HeartsRobotCustom(this.#model, this.#controller, position)
        );
        // const robots = ['north', 'east', 'west'].map(position => 
        //    new HeartsRobotKmp(this.#model, this.#controller, position)
        // );
        this.#controller.startGame('RobotNorth', 'RobotEast', playerName, 'RobotWest');
        this.#updateScoreBoard();
    }

    #handleStateUpdate() {
        const state = this.#model.getState();
        this.#gameState.textContent = `Game State: ${state}`;

        if (state === 'passing') {
            this.#handlePassingState();
        } else if (state === 'playing') {
            this.#handlePlayingState();
        } else if (state === 'complete') {
            this.#handleGameOver();
        }
    }

    #handlePassingState() {
        const passing = this.#model.getPassing();
        if (passing !== 'none') {
            this.#messageArea.textContent = `Pass 3 cards ${passing}`;
            this.#renderAllHands();
            this.#renderPassCardsArea();
        }
    }

    #handlePlayingState() {
        this.#messageArea.textContent = "Playing";
        this.#renderAllHands();
        this.#passCardsArea.innerHTML = '';
    }

    #handleGameOver() {
        let winner = null;
        let winningScore = Infinity;
        HU.positions.forEach(p => {
            const score = this.#model.getScore(p);
            if (score < winningScore) {
                winningScore = score;
                winner = p;
            }
        });
        this.#messageArea.textContent = `Game Over! ${this.#model.getPlayerName(winner)} wins!`;
    }

    #renderAllHands() {
        HU.positions.forEach(position => {
            this.#renderHand(position);
        });
    }

    #renderHand(position) {
        const hand = this.#model.getHand(position);
        const handElement = this.#playerHands[position];
        handElement.innerHTML = '';
        
        if (position === 'south') {
            hand.getCards().forEach(card => {
                const cardElement = this.#createCardElement(card, true);
                cardElement.addEventListener('click', () => this.#handleCardClick(card));
                handElement.appendChild(cardElement);
            });
        } else {
            const cardCount = hand.getCards().length;
            for (let i = 0; i < cardCount; i++) {
                const cardElement = this.#createCardElement(null, false);
                cardElement.style.position = 'absolute';
                
                if (position === 'north' || position === 'south') {
                    cardElement.style.left = `calc(50% - 50px + ${i * 2}px)`;  
                } else if (position === 'west') {
                    cardElement.style.top = `${i * 2}px`;
                } else if (position === 'east') {
                    cardElement.style.bottom = `${i * 2}px`;
                }
                
                handElement.appendChild(cardElement);
            }
        }
    }
    
    // SVG Generated Cards code from ChatGPT

    #createCardElement(card, faceUp = false) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        
        if (faceUp && card) {
            cardElement.innerHTML = this.#generateCardSVG(card);
        } else {
            cardElement.innerHTML = this.#generateCardBackSVG();
        }
        
        return cardElement;
    }

    #generateCardSVG(card) {
        const suit = card.getSuit();
        const rank = card.getRankName();
        const color = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
        const suitSymbol = this.#getSuitSymbol(suit);

        return `
            <svg width="100" height="140" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="140" rx="10" ry="10" fill="white" stroke="black" stroke-width="2"/>
                <text x="10" y="30" font-family="Arial" font-size="20" fill="${color}">${rank}</text>
                <text x="10" y="55" font-family="Arial" font-size="30" fill="${color}">${suitSymbol}</text>
                <text x="90" y="130" font-family="Arial" font-size="20" fill="${color}" text-anchor="end">${rank}</text>
                <text x="90" y="105" font-family="Arial" font-size="30" fill="${color}" text-anchor="end">${suitSymbol}</text>
            </svg>
        `;
    }

    #generateCardBackSVG() {
        return `
            <svg width="100" height="140" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="140" rx="10" ry="10" fill="navy" stroke="black" stroke-width="2"/>
                <rect x="10" y="10" width="80" height="120" rx="5" ry="5" fill="none" stroke="gold" stroke-width="2"/>
                <text x="50" y="80" font-family="Arial" font-size="40" fill="gold" text-anchor="middle">♠</text>
            </svg>
        `;
    }

    #getSuitSymbol(suit) {
        switch (suit) {
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            case 'spades': return '♠';
        }
    }

    #handleCardClick(card) {
        if (this.#model.getState() === 'passing') {
            this.#toggleCardSelection(card);
        } else if (this.#model.getState() === 'playing') {
            this.#playCard(card);
        }
    }

    #toggleCardSelection(card) {
        const index = this.#selectedCards.findIndex(c => c.equals(card));
        if (index === -1) {
            if (this.#selectedCards.length < 3) {
                this.#selectedCards.push(card);
            }
        } else {
            this.#selectedCards.splice(index, 1);
        }
        this.#renderHand('south');
        this.#renderPassCardsArea();
    }

    #renderPassCardsArea() {
        this.#passCardsArea.innerHTML = '';
        if (this.#selectedCards.length === 3) {
            const passButton = document.createElement('button');
            passButton.textContent = 'Pass Cards';
            passButton.addEventListener('click', () => this.#passCards());
            this.#passCardsArea.appendChild(passButton);
        }
    }

    async #passCards() {
        this.#passCardsArea.innerHTML = 'Passing cards...';
        await this.#controller.passCards('south', this.#selectedCards);
        this.#selectedCards = [];
        this.#passCardsArea.innerHTML = '';
    }

    async #playCard(card) {
        if (this.#controller.isPlayable('south', card)) {
            this.#messageArea.textContent = 'Playing card...';
            this.#playCardSelectSound();
            await this.#controller.playCard('south', card);
            this.#messageArea.textContent = 'Playing';
        } else {
            alert('This card cannot be played now.');
        }
    }

    #playCardSelectSound() {
        this.#cardSelectSound.currentTime = 0;
        this.#cardSelectSound.play();
    }

    #handleTrickStart() {
        this.#currentTrick.innerHTML = '';
        this.#renderAllHands();
    }

    #handleTrickPlay(e) {
        const { position, card } = e.detail;
        const cardElement = this.#createCardElement(card, true);
        cardElement.classList.add(`trick-card-${position}`);
        this.#currentTrick.appendChild(cardElement);

        if (position === 'south') {
            this.#renderHand('south');
        } else {
            this.#renderHand(position);
        }
    }

    #handleTrickCollected(e) {
        const { position } = e.detail;
        this.#messageArea.textContent = `Trick collected by ${this.#model.getPlayerName(position)}`;
        this.#updateScoreBoardAfterTrick();
        setTimeout(() => {
            this.#currentTrick.innerHTML = '';
            this.#messageArea.textContent = 'Playing';
        }, 2000);
    }

    #updateScoreBoardAfterTrick() {
        const currentPoints = {};
        HU.positions.forEach(pos => {
            currentPoints[pos] = this.#model.getCurrentGamePoints(pos);
        });

        const scoreLog = this.#model.getScoreLog();
        const totalScores = HU.positions.reduce((acc, pos) => {
            acc[pos] = this.#model.getScore(pos);
            return acc;
        }, {});


        // ScoreBoard Layout code from ChatGPT
        
        let scoreBoardHTML = `
            <table>
                <tr>
                    <th>Round</th>
                    ${HU.positions.map(p => `<th>${this.#model.getPlayerName(p)}</th>`).join('')}
                </tr>
        `;

        scoreLog.forEach((round, index) => {
            scoreBoardHTML += `
                <tr>
                    <td>${index + 1}</td>
                    ${HU.positions.map(p => `<td>${round[p]}</td>`).join('')}
                </tr>
            `;
        });

        scoreBoardHTML += `
            <tr class="current-round">
                <td>${this.#currentRound + 1}</td>
                ${HU.positions.map(p => `<td>${currentPoints[p]}</td>`).join('')}
            </tr>
            <tr class="total-score">
                <td>Total</td>
                ${HU.positions.map(p => `<td>${totalScores[p] + currentPoints[p]}</td>`).join('')}
            </tr>
        </table>
        `;

        this.#scoreBoard.innerHTML = scoreBoardHTML;
    }

    #handleScoreUpdate(e) {
        const { entry, moonshooter } = e.detail;
        if (moonshooter) {
            alert(`${this.#model.getPlayerName(moonshooter)} shot the moon!`);
        }
        this.#currentRound++;
        this.#updateScoreBoard();
    }

    #updateScoreBoard() {
        const scoreLog = this.#model.getScoreLog();
        const totalScores = HU.positions.reduce((acc, pos) => {
            acc[pos] = this.#model.getScore(pos);
            return acc;
        }, {});

        let scoreBoardHTML = `
            <table>
                <tr>
                    <th>Round</th>
                    ${HU.positions.map(p => `<th>${this.#model.getPlayerName(p)}</th>`).join('')}
                </tr>
        `;

        scoreLog.forEach((round, index) => {
            scoreBoardHTML += `
                <tr>
                    <td>${index + 1}</td>
                    ${HU.positions.map(p => `<td>${round[p]}</td>`).join('')}
                </tr>
            `;
        });

        scoreBoardHTML += `
            <tr class="total-score">
                <td>Total</td>
                ${HU.positions.map(p => `<td>${totalScores[p]}</td>`).join('')}
            </tr>
        </table>
        `;

        this.#scoreBoard.innerHTML = scoreBoardHTML;
    }
}