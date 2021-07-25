// jshint esversion:6
$(document).ready(function() {
  $('#main_table').DataTable({
    "columnDefs": [{
      "orderable": false,
      "targets": [4, 5, 6, 7, 8]
    }]
  });

  $('#address_table').DataTable({
    "columnDefs": [{
      "orderable": false,
      "targets": [1, 5, 6]
    }]
  });

  $('#phone_table').DataTable({
    "columnDefs": [{
      "orderable": false,
      "targets": [3, 4]
    }]
  });

  $('#date_table').DataTable({
    "columnDefs": [{
      "orderable": false,
      "targets": [2, 3]
    }]
  });
});
