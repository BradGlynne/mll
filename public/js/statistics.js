
getStatistics();

function getStatistics() {
    $.get("/statistics", (response) => {
        console.log(response);
        $(".outstanding").html(response.outstanding);
        $(".completion").html(response.time);

    });
}