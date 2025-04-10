export class StyleRegistry {
    static #styles = new Map();

    static register(componentName, styles) {
        this.#styles.set(componentName, styles);
    }

    static get(componentName) {
        return this.#styles.get(componentName);
    }

    static applyStyles(element, componentName, variant = 'default') {
        const styles = this.#styles.get(componentName);
        if (styles && styles[variant]) {
            Object.assign(element.style, styles[variant]);
        }
    }
}

// Register common styles
StyleRegistry.register('window', {
    default: {
        position: 'absolute',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
    },
    titleBar: {
        padding: '8px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
});
