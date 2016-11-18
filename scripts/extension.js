
document.addEventListener('DOMContentLoaded', function() {

    $('#status').html("Extension loaded");

    $('#problem').on('click', exportProblem);

    $('#change').on('click', exportChange);

    const $milestone = $('#milestone');
    const id = PROJECT;
    const populate = function(milestones) {
        milestones.forEach(function (milestone) {
            if (milestone.state === 'active') {
                $milestone.append(
                    '<option value="' + milestone.id + '">'
                    + '[' + milestone.id + '] ' + milestone.title + ' '
                    + (milestone.description ?
                        (milestone.description.substring(0, 30).replace(new RegExp('#', 'g'), '')).trim() +
                        (milestone.description.length > 30 ? '...' : '')
                        :
                        ''
                      ) +
                    '</option>'
                );
            }
        });
    };

    if (MILESTONES.length) {

        populate(MILESTONES);

    } else {

        $.ajax({
            method: 'GET',
            url: URL_GITLAB.replace(':id', id).replace(':resource', 'milestones') + '?state=active',
            beforeSend: function(xhr) {
                 xhr.setRequestHeader("PRIVATE-TOKEN", PK)
            }, success: function(data) {
                populate(data);
            }
        });
    }
});


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
    const label = $('#label').val();
    const id = PROJECT;
    const $status = $('#status');

    const query = {active: true, currentWindow: true};

    $status.html('Sending to gitlab');

    const save = function(results) {

        if (results.length) {
            // && confirm('Deseja exportar esse recurso para a "Milestone ' + milestone_id + '"')

            const data = results[0];
            const letter = type === 'problem' ? 'P' : 'M';
            const prefix = '[' + letter + '-' + data[0] + '] ';
            const issue = {
                id: id,
                title: prefix + data[1],
                description: data[2] +
                    '\n\n----\n[[View it on GLPI](' + URL_GLPI.replace(':id', data[0]).replace(':type', type) + ')]',
                milestone_id: milestone_id,
                labels: type + (label ? ',' + label : '')
            };

            $.ajax({
                    method: 'POST',
                    url: URL_GITLAB.replace(':id', id).replace(':resource', 'issues'),
                    data: issue,
                    beforeSend: function(xhr) {
                         xhr.setRequestHeader("PRIVATE-TOKEN", PK)
                    }, success: function(data) {
                        $status.html("Done!");
                    }
            });
        }
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
