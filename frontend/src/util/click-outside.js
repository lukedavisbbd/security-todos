/**
 * @param {Node} node
 * @param {() => void} handler
 */
export function clickOutside(node, handler) {
    const handleClick = event => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            handler();
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    }
}
