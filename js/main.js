

d3.csv("data/chart_data_clean.csv", function(data) {

    // Analyze the dataset in the web console
    console.log(data);

    line_plot = new LinePlot('scatter-plot', data, 'Malaria Worldwide');

});