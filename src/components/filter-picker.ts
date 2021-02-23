import { Filter } from '../Filter';

export class FilterPicker extends EventTarget
{

    constructor() {
        super(); 
    }

    public static create(id: string, filter: Filter, e: any, parent: HTMLElement) {
        let element = document.createElement('div');
        let iconGlobal = document.createElement('i');
        let iconLocal = document.createElement('i');
        let iconHighlight = document.createElement('i');
        iconGlobal.classList.add('fas','fa-filter','filter-picker-icon');
        iconLocal.classList.add('fas','fa-strikethrough','filter-picker-icon');
        iconHighlight.classList.add('fas','fa-highlighter','filter-picker-icon');
        iconGlobal.addEventListener('click', (e) => document.dispatchEvent(new CustomEvent('addFilter', {detail: {filter: filter}})));
        element.appendChild(iconGlobal);
        element.appendChild(iconLocal);
        element.appendChild(iconHighlight);
        element.setAttribute("id", id);
        element.classList.add('filter-picker');
        element.style.left = (e.clientX-parent.getBoundingClientRect().left)+'px';
        element.style.top = (e.clientY-parent.getBoundingClientRect().top)+'px';
        return element;
    }   
}