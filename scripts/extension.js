
document.addEventListener('DOMContentLoaded', function() {

    const $status = $('#status');

    $status.html("Extension loaded");

    document.getElementById('problem').addEventListener('click', exportProblem);

    document.getElementById('change').addEventListener('click', exportChange);

    function exportProblem()
    {
        exportIssue('problem');
    }

    function exportChange()
    {
        exportIssue('change');
    }

    function exportIssue (type)
    {
        const milestone_id = $('#milestone').val();
        const id = $('#id').val();

        const query = {active: true, currentWindow: true};

        $status.html('Sending to gitlab');

        const save = function(results) {

            const data = results[0];
            const letter = type === 'problem' ? 'P' : 'M';
            const prefix = '[' + letter + '-' + data[0] + '] ';
            const issue = {
                id: id,
                title: prefix + data[1],
                description: data[2],
                milestone_id: milestone_id,
                labels: type
            };

            $.ajax({
                    method: 'POST',
                    url: URL.replace(':id', id),
                    data: issue,
                    beforeSend: function(xhr) {
                         xhr.setRequestHeader("PRIVATE-TOKEN", PK)
                    }, success: function(data) {
                        $status.html("Done!");
                    }
            });
        };

        chrome.tabs.query(query, function(tabs) {
            const
                tab = tabs[0],
                url = tab.url;

            chrome.tabs.executeScript(tab.id, {
                code:
                '[document.querySelector(\'[name="id"]\').value , '
                + 'document.querySelector(\'[name="name"]\').value, '
                + 'document.querySelector(\'[name="content"]\').value, '
                + ']'
            }, save);
        });
    }

});
