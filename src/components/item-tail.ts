import { ColumnNumeric } from "../ColumnNumeric";
export class ItemTail extends EventTarget
{

    constructor() {
        super();
    }

    private static setContent(state: 'open' | 'close', count: number, parent: HTMLDivElement) {
        
        while(parent.firstChild)
            parent.removeChild(parent.firstChild);

        let textElement = document.createElement('span');
        let text = (state == 'open') ? 'close' : count + " more items...";
        textElement.textContent = text;

        let iconElement = document.createElement('i');
        let icon = (state == 'open') ? 'fa-arrow-circle-close' : 'fa-arrow-circle-down';
        iconElement.classList.add('fas', icon, 'item-tail-icon');
        
        parent.appendChild(iconElement);
        parent.appendChild(textElement);
    }

    // create should always start with closed state

    public static create(count: number, key: string, state: 'open' | 'close', 
        column: ColumnNumeric, i: number, nGram? : number, lsd?: boolean) {
        let element = document.createElement('div');

        this.setContent(state, count, element);

        element.addEventListener('click', (e) => {
            state = (state == 'open') ? 'close' : 'open';
            this.setContent(state, count, element);
            document.dispatchEvent(new CustomEvent('itemTailClicked', {
                detail: {
                    state: state, 
                    key: key, 
                    i: i, 
                    column: column,
                    nGram: nGram,
                    lsd: lsd
                }}))
        });
        
        element.classList.add('item-tail-parent');

        return element;
    } 
}