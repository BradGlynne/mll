function addServiceOverride() {
    const type = $(".add-overrides-wrapper #type").val();
    const startSystem = $(".add-overrides-wrapper #override-start-system").val();
    const destinationSystem = $(".add-overrides-wrapper #override-destination-system").val();
    const maxVolume = $(".add-overrides-wrapper #max-volume").val();
    const maxCollateral = $(".add-overrides-wrapper #max-collateral").val();
    const flatRate = $(".add-overrides-wrapper #Flatrate").val();
    const rushShippingCharge = $(".add-overrides-wrapper #rush-shipping-charge").val();
    const isRush = $(".add-overrides-wrapper #rush-shipping").is(':checked');

    const data = { type, startSystem, destinationSystem, maxVolume, maxCollateral, flatRate, isRush, rushShippingCharge };


    $.ajax({
        type: "POST",
        url: "/servicesOverride/add",
        data: data,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        error: function (response) {
            if (response.err) {
                alert("Error" + response.err);
            }
            else {
                location.reload();
            }
        }

    });

}

function removeOverride(id) {
    const data = { id };

    $.ajax({
        type: "POST",
        url: "/servicesOverride/remove",
        data: data,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        error: function (response) {
            if (response.err) {
                alert("Error" + response.err);
            }
            else {
                location.reload();
            }
        }

    });

}

function loadOverride() {
    const id = $("#override-edit-select").val();

    $.ajax({
        type: "POST",
        url: "/servicesOverride/get",
        data: { id },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.err) {
                alert("Error" + response.err);
            }
            else {
                $(".edit-route-wrapper #route-type").val(response[0].routeType);
                $(".edit-route-wrapper #start-system").val(response[0].start);
                $(".edit-route-wrapper #destination-system").val(response[0].destination);
                $(".edit-route-wrapper #max-JFvolume").val(response[0].maxVolume);
                $(".edit-route-wrapper #min-reward").val(response[0].minReward);
                $(".edit-route-wrapper #max-JFcollateral").val(response[0].maxCollateral);
                $(".edit-route-wrapper #JFFlatprice").val(response[0].flatPrice);
                $(".edit-route-wrapper #JFprice").val(response[0].price);
                $(".edit-route-wrapper #rush-shipping-charge").val(response[0].rushShippingCharge);
                $(".edit-route-wrapper #collateral-multiplier").val(response[0].collateralMultiplier);
                $(".edit-route-wrapper #flat-rate").prop('checked', response[0].isFlat);
                $(".edit-route-wrapper #rush-shipping").prop('checked', response[0].isRush);

            }
        }

    });

}


function toggleOverrideRush(id) {
    const data = { id };

    $.ajax({
        type: "POST",
        url: "/servicesOverride/toggleRush",
        data: data,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        error: function (response) {
            console.log("mao");
            location.reload();
        },
    });

}


function editOverride() {
    const id = $("#route-edit-select").val();
    const routeType = $(".edit-route-wrapper #route-type").val();
    const startSystem = $(".edit-route-wrapper #start-system").val();
    const destinationSystem = $(".edit-route-wrapper #destination-system").val();
    const minReward = $(".edit-route-wrapper #min-reward").val();
    const maxJFVolume = $(".edit-route-wrapper #max-JFvolume").val();
    const maxJFCollateral = $(".edit-route-wrapper #max-JFcollateral").val();
    const flatPrice = $(".edit-route-wrapper #JFFlatprice").val();
    const price = $(".edit-route-wrapper #JFprice").val();
    const rushShippingCharge = $(".edit-route-wrapper #rush-shipping-charge").val();
    const collateralMultiplier = $(".edit-route-wrapper #collateral-multiplier").val();
    const isFlat = $(".edit-route-wrapper #flat-rate").is(':checked');
    const isRush = $(".edit-route-wrapper #rush-shipping").is(':checked');

    const data = { id, routeType, startSystem, destinationSystem, minReward, maxJFVolume, maxJFCollateral, flatPrice, price, rushShippingCharge, collateralMultiplier, isFlat, isRush };

    $.ajax({
        type: "POST",
        url: "/servicesOverride/edit",
        data: data,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            if (response.err) {
                alert("Error" + response.err);
            }
            else {
                location.reload();
            }
        }

    });

}



$("body").on("input", "#override-start-system", function () {
    const name = $(this).val().toString().trim().toLowerCase();
    if (name.length >= 3) {
        $.get("/system/search/" + name, (data) => {
            results = ""
            data.forEach((system) => {
                results += "<div class='result start-result' name='" + system.name + "' id='" + system.id + "' >" + system.name + " ( " + system.security + " )</div>";
            })
            $(".override-start-system .search-results").html(results);
        });
    }
    else {
        $(".override-start-system .search-results").html("");
    }
});

$("body").on("input", "#override-destination-system", function () {
    const name = $(this).val().toString().trim().toLowerCase();
    if (name.length >= 3) {
        $.get("/system/search/" + name, (data) => {
            results = ""
            data.forEach((system) => {
                results += "<div class='result finish-result' name='" + system.name + "' id='" + system.id + "' >" + system.name + " ( " + system.security + " )</div>";
            })
            $(".add-overrides-wrapper .override-destination-system .search-results").html(results);
        });
    }
    else {
        $(".add-overrides-wrapper .override-destination-system .search-results").html("");
    }
});
