
document.addEventListener('DOMContentLoaded', function() {

    $('#status').html("Extension loaded");

    $('#problem').on('click', exportProblem);

    $('#change').on('click', exportChange);

    $('#project').on('change', selectProject);

    const $project = $('#project');
    const populateProjects = function(projects) {
        projects.forEach(function (project) {
            $project.append(
                '<option value="' + project.id + '">'
                + '[' + project.id + '] ' + project.name + ' ' +
                '</option>'
            );
        });
    };

    if (PROJECTS.length) {

        populateProjects(PROJECTS);

    } else {

        $.ajax({
            method: 'GET',
            url: URL_GITLAB.replace('/:id/:resource', '') + '?order_by=id&sort=asc',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("PRIVATE-TOKEN", PK)
            }, success: function(data) {
                populateProjects(data);
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

function selectProject()
{
    const $milestone = $('#milestone').html('');
    const id = $('#project option:selected').val();
    const populateMilestones = function(milestones) {
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

        populateMilestones(MILESTONES);

    } else {

        $.ajax({
            method: 'GET',
            url: URL_GITLAB.replace(':id', id).replace(':resource', 'milestones') + '?state=active',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("PRIVATE-TOKEN", PK)
            }, success: function(data) {
                populateMilestones(data);
            }
        });
    }
}

function exportIssue (type)
{
    const milestone_id = $('#milestone').val();
    const label = $('#label').val();
    const id = $('#project option:selected').val();
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
                labels: type + (label ? ',' + label : '')
            };

            if (milestone_id !== '-') {
                issue.milestone_id = milestone_id;
            }

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
