import { Filter } from '../Filter';

export class FilterPicker extends EventTarget
{

    constructor() {
        super(); 
    }

    public static create(id: string, filter: Filter, e: any, parent: HTMLElement) {
        let picker = document.createElement('div');
        let pickerContent = document.createElement('div');
        let iconGlobal = document.createElement('i');
        let iconLocal = document.createElement('i');
        let iconHighlight = document.createElement('i');
        iconGlobal.classList.add('fas','fa-filter','filter-picker-icon');
        iconLocal.classList.add('fas','fa-strikethrough','filter-picker-icon');
        iconHighlight.classList.add('fas','fa-highlighter','filter-picker-icon');
        iconLocal.addEventListener('click', (e) => document.dispatchEvent(new CustomEvent('addFilter', {detail: {filter: filter}})));
        iconHighlight.addEventListener('click', (e) => document.dispatchEvent(new CustomEvent('addHighlight', {detail: {filter: filter}})));
        pickerContent.appendChild(iconGlobal);
        pickerContent.appendChild(iconLocal);
        pickerContent.appendChild(iconHighlight);
        pickerContent.classList.add('filter-picker-content');
        picker.appendChild(pickerContent);
        picker.setAttribute("id", id);
        picker.classList.add('filter-picker');
        picker.style.left = (e.clientX-parent.getBoundingClientRect().left)+'px';
        picker.style.top = (e.clientY-parent.getBoundingClientRect().top)+'px';
        return picker;
    }   
}