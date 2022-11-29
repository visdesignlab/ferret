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
            color: 'null'
        },
        {
            key: 'value-distribution',
            label: 'Value Distribution',
            color: 'yellow'
        },
        { key: 'frequent-values', label: 'Frequent Values', color: 'pink' },
        { key: 'replicates', label: 'Replicates', color: 'sea-blue' },
        { key: 'n-gram', label: 'N-Grams', color: 'orange' },
        {
            key: 'leading-digit-frequency',
            label: 'Leading Digit Frequency',
            color: 'blue'
        },
        {
            key: 'terminal-digit-frequency',
            label: 'Terminal Digit Frequency',
            color: 'null'
        },
        {
            key: 'decimal-count',
            label: 'Decimal Places',
            color: 'null'
        },
        {
            key: 'sorting',
            label: 'Sorting',
            color: 'null'
        },
        {
            key: 'general',
            label: 'General',
            color: 'null'
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
        this._expanded = false;

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
        this._showMoreLessButton = document.getElementById(
            'description-show-more-less'
        ) as HTMLButtonElement;

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
    }

    private onShowMoreLessClick(): void {
        this._expanded = !this.expanded;
        if (this.expanded) {
            this.showMoreLessButton.innerText = 'Show less.';
            // this.longText.classList.remove('d-none');
        } else {
            this.showMoreLessButton.innerText = 'Show more.';
            // this.longText.classList.add('d-none');
        }
    }
}
