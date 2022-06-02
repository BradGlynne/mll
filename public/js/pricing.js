$(document).ready(function () {
    // Setup - add a text input to each footer cell
    $('#jf-routes thead tr')
        .clone(true)
        .addClass('filters')
        .appendTo('#jf-routes thead');

    var table = $('#jf-routes').DataTable({
        orderCellsTop: true,
        fixedHeader: true,
        paging: false,
        order: [[9, 'desc']],
        initComplete: function () {
            var api = this.api();

            // For each column
            api
                .columns([0,2,3,4,5,6,7,8,9])
                .eq(0)
                .each(function (colIdx) {
                    // Set the header cell to contain the input element
                    var cell = $('.filters th').eq(
                        $(api.column(colIdx).header()).index()
                    );
                    var title = $(cell).text();
                    $(cell).html('<input type="text" placeholder="' + title + '" />');

                    // On every keypress in this input
                    $(
                        'input',
                        $('.filters th').eq($(api.column(colIdx).header()).index())
                    )
                        .off('keyup change')
                        .on('keyup change', function (e) {
                            e.stopPropagation();

                            // Get the search value
                            $(this).attr('title', $(this).val());
                            var regexr = '({search})'; //$(this).parents('th').find('select').val();

                            var cursorPosition = this.selectionStart;
                            // Search the column for that value
                            api
                                .column(colIdx)
                                .search(
                                    this.value != ''
                                        ? regexr.replace('{search}', '(((' + this.value + ')))')
                                        : '',
                                    this.value != '',
                                    this.value == ''
                                )
                                .draw();

                            $(this)
                                .focus()[0]
                                .setSelectionRange(cursorPosition, cursorPosition);
                        });
                });
        },
    });

    $.fn.dataTable.ext.search.push(
  function( settings, searchData, index, rowData, counter ) {
    if ( settings.nTable.id == 'jf-routes' ) {

    var routes = $('input:checkbox[name="routeType"]:checked').map(function() {
      return this.value;
    }).get();

    if (routes.length === 0) {
      return true;
    }

    if (routes.indexOf(searchData[9]) !== -1) {
      return true;
    }

    return false;
  }
  }
);

var table = $('#jf-routes').DataTable();

 $('input:checkbox').on('change', function () {
    table.draw();
 });

document.getElementById("standard").click();
document.getElementById("intraDrone").click();


$('#per-jump-overrides thead tr')
    .clone(true)
    .addClass('filters')
    .appendTo('#per-jump-overrides thead');

var perJumpTable = $('#per-jump-overrides').DataTable({
    orderCellsTop: true,
    fixedHeader: true,
    paging: false,
    order: [[1, 'asc']],
    initComplete: function () {
        var api = this.api();

        // For each column
        api
            .columns([0,1,3,4,5,6,7])
            .eq(0)
            .each(function (colIdx) {
                // Set the header cell to contain the input element
                var cell = $('.filters th').eq(
                    $(api.column(colIdx).header()).index()
                );
                var title = $(cell).text();
                $(cell).html('<input type="text" placeholder="' + title + '" />');

                // On every keypress in this input
                $(
                    'input',
                    $('.filters th').eq($(api.column(colIdx).header()).index())
                )
                    .off('keyup change')
                    .on('keyup change', function (e) {
                        e.stopPropagation();

                        // Get the search value
                        $(this).attr('title', $(this).val());
                        var regexr = '({search})'; //$(this).parents('th').find('select').val();

                        var cursorPosition = this.selectionStart;
                        // Search the column for that value
                        api
                            .column(colIdx)
                            .search(
                                this.value != ''
                                    ? regexr.replace('{search}', '(((' + this.value + ')))')
                                    : '',
                                this.value != '',
                                this.value == ''
                            )
                            .draw();

                        $(this)
                            .focus()[0]
                            .setSelectionRange(cursorPosition, cursorPosition);
                    });
            });
    },
});


});




//function intraRoutes(checkbox)
//{
//    if (checkbox.checked)
//    {
//        const table = document.getElementById('jf-routes');
//        const arr = ;
//        for(const obj of arr){
//          const row = document.createElement('tr');
//          for(const val of Object.values(obj)){
//            const col = document.createElement('td');
//            col.textContent = val;
//            row.appendChild(col);
//                  }
//          table.appendChild(row);
//        }
//         location.reload();
//}
//    if (!checkbox.checked){
//            var rows = document.getElementsByTagName("tr");
//                for (var i = rows.length; i--;) {
//                  if(rows[i].innerHTML.indexOf("Intra-Drones") !== -1) {
//                    rows[i].parentNode.removeChild( rows[i] );
//                  }
//                }
//    }
//};
