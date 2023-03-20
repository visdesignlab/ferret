export interface DescriptionMetadata {
    key: string;
    label: string;
    color: string;
}

export interface HTMLZeroMDElement extends HTMLElement {
    src: string;
}

export class DescriptionDisplay {
    private descriptions: DescriptionMetadata[] = [
        {
            key: 'formatting',
            label: 'Formatting Artifacts',
            color: 'chart-'
        },
        {
            key: 'value-distribution',
            label: 'Value Distribution',
            color: 'chart-'
        },
        {
            key: 'frequent-values',
            label: 'Duplicate Numbers',
            color: 'chart-fv'
        },
        { key: 'replicates', label: 'Replicates', color: 'chart-r' },
        { key: 'n-gram', label: 'Duplicate Digits', color: 'chart-ng' },
        {
            key: 'leading-digit-frequency',
            label: 'Leading Digits',
            color: 'chart-ldf'
        },
        {
            key: 'terminal-digit-frequency',
            label: 'Trailing Digits',
            color: 'chart-td'
        },
        {
            key: 'decimal-count',
            label: 'Precision',
            color: 'chart-dc'
        },
        {
            key: 'sorting',
            label: 'Structural Overview',
            color: 'chart-'
        },
        {
            key: 'general',
            label: 'Check Domain Expectations',
            color: 'chart-'
        }
    ];

    private _container: HTMLDivElement;
    public get container(): HTMLDivElement {
        return this._container;
    }

    private _expanded: boolean;
    public get expanded(): boolean {
        return this._expanded;
    }

    private _indexShown: number;
    public get indexShown(): number {
        return this._indexShown;
    }

    private _tabContainer: HTMLDivElement;
    public get tabContainer(): HTMLDivElement {
        return this._tabContainer;
    }

    private _shortImage: HTMLImageElement;
    public get shortImage(): HTMLImageElement {
        return this._shortImage;
    }

    private _shortText: HTMLZeroMDElement;
    public get shortText(): HTMLZeroMDElement {
        return this._shortText;
    }

    private _longText: HTMLZeroMDElement;
    public get longText(): HTMLZeroMDElement {
        return this._longText;
    }

    private _showMoreLessButton: HTMLButtonElement;
    public get showMoreLessButton(): HTMLButtonElement {
        return this._showMoreLessButton;
    }

    constructor(container: HTMLDivElement) {
        this._container = container;
        if (localStorage && localStorage.getItem('expanded')) {
            this._expanded = localStorage.getItem('expanded') === 'true';
        } else {
            this._expanded = true;
        }

        this._tabContainer = document.getElementById(
            'description-tab-row'
        ) as HTMLDivElement;
        this._shortImage = document.getElementById(
            'description-short-image'
        ) as HTMLImageElement;
        this._shortText = document.getElementById(
            'description-short-text'
        ) as HTMLZeroMDElement;
        this._longText = document.getElementById(
            'description-long-text'
        ) as HTMLZeroMDElement;

        this._longText.classList.toggle('show', this._expanded);

        this._showMoreLessButton = document.getElementById(
            'description-show-more-less'
        ) as HTMLButtonElement;

        this.setShowMoreLessButtonText();
        this.showMoreLessButton.onclick = (ev: MouseEvent) => {
            this.onShowMoreLessClick();
        };

        document.addEventListener(
            'changeCurrentChartIndex',
            (event: CustomEvent) => {
                this.setDescriptionIndex(event.detail.chartIndex);
            }
        );
    }

    public init(): void {
        this.setDescriptionIndex(0);
    }

    private setDescriptionIndex(index: number): void {
        this._indexShown = index;
        const desc = this.descriptions[index];
        const folder = './assets/descriptions/';
        this.shortImage.src = folder + desc.key + '.svg';
        this.shortText.src = folder + desc.key + '-short.md';
        this.longText.src = folder + desc.key + '-long.md';

        this.tabContainer.innerHTML = '';
        let inner = document.createElement('span');
        inner.innerHTML = desc.label;
        inner.classList.add('p-2', 'rounded', desc.color);
        this.tabContainer.appendChild(inner);
    }

    private onShowMoreLessClick(): void {
        this._expanded = !this.expanded;
        if (localStorage) {
            localStorage.setItem('expanded', `${this._expanded}`);
        }
        this.setShowMoreLessButtonText();
    }
    private setShowMoreLessButtonText(): void {
        if (this.expanded) {
            this.showMoreLessButton.innerText = 'Show less.';
        } else {
            this.showMoreLessButton.innerText = 'Show more.';
        }
    }
}
