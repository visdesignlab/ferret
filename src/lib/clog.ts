export default class clog {
    public static h1(text: string): void {
        console.log(
            `%c${text}`,
            'background: tomato; color: white; font-size: 16pt;' +
                'padding: 4px 2px; border-radius: 4px'
        );
    }
}
