export class HeartsRobotCustom {
    #model;
    #controller;
    #position;

    constructor(model, controller, position) {
        this.#model = model;
        this.#controller = controller;
        this.#position = position;

        this.#model.addEventListener('stateupdate', () => {
            let state = this.#model.getState();
            if ((state == 'passing') && (this.#model.getPassing() != 'none')) {
                setTimeout(() => {
                    let cards_to_pass = this.#selectCardsToPass();
                    this.#controller.passCards(this.#position, cards_to_pass);  
                }, 1000);
            } 
        });
        
        this.#model.addEventListener('trickstart', () => setTimeout(() => this.#playCard(), 2000));
        this.#model.addEventListener('trickplay', () => setTimeout(() => this.#playCard(), 1000)); 
    }

    #selectCardsToPass() {
        let hand = this.#model.getHand(this.#position);
        let cards = hand.getCards();
        
        // Strategy: Pass the three highest cards
        cards.sort((a, b) => b.getRank() - a.getRank());
        return cards.slice(0, 3);
    }

    #playCard() {
        if (this.#model.getCurrentTrick().nextToPlay() == this.#position) {
            let playable_cards = this.#model.getHand(this.#position)
                                            .getCards()
                                            .filter(c => this.#controller.isPlayable(this.#position, c));
            if (playable_cards.length > 0) {
                let card = this.#selectLowestCard(playable_cards);
                this.#controller.playCard(this.#position, card);
            } else {
                console.log(`${this.#position} has no playable cards`);
            }
        }
    }

    #selectLowestCard(playableCards) {
        // Strategy: Always play the lowest ranked card
        return playableCards.reduce((lowest, card) => 
            card.getRank() < lowest.getRank() ? card : lowest
        );
    }
}