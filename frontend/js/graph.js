/* exported graph */
const graph = (function() {
    'use strict';
    const data = [30, 86, 168, 281, 303, 365];

    /**
     * Creates a graph on the DOM.
     *
     * @param {Element} selector The graph container
     * @param {[Integer]} data The data to graph
     */
    function createBarChart(selector, data) {
        d3.select(selector)
        .selectAll('div')
        .data(data)
            .enter()
            .append('div')
            .style('width', function(d) {
                return d + 'px';
            })
            .text(function(d) {
                return d;
            });
    };

    createBarChart('.chart', data);
}());
