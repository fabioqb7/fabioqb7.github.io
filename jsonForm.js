class FormJSON {

    constructor(json, cont) {

        var thisclass = this;
        thisclass.data = {};

        if (cont)
            thisclass.container = document.getElementById(cont);
        else
            thisclass.container = document.getElementById("formJSON");

        this.jsfiles = ["https://cdn.jsdelivr.net/npm/flatpickr", "https://cdn.quilljs.com/1.3.6/quill.js", "https://docs.handsontable.com/pro/5.0.0/components/handsontable-pro/dist/handsontable.full.min.js", "https://sdk.amazonaws.com/js/aws-sdk-2.283.1.min.js"];

        this.cssfiles = ["https://fabioqb7.github.io/jsonForm.css", "https://docs.handsontable.com/pro/5.0.0/components/handsontable-pro/dist/handsontable.full.min.css", "https://cdn.quilljs.com/1.3.6/quill.snow.css", "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"];

        for (var i = 0; i < this.cssfiles.length; i++) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = this.cssfiles[i];
            link.media = 'all';
            thisclass.container.appendChild(link);
        }

        function loadjs(callback) {
            var js = thisclass.jsfiles.pop();
            if (js) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = js;
                script.onload = function() {
                    loadjs(callback);
                }
                ;
                document.head.appendChild(script);
            } else
                callback();

        }

        loadjs(function() {
            console.log("all donde");

            if (typeof json == 'object') {
                thisclass.schema = json;
                thisclass.draw();
            }

            if (typeof json == "string") {
                thisclass.getURL(json, function(err, text) {
                    if (!err) {
                        thisclass.schema = JSON.parse(text);
                        thisclass.draw();
                    }
                });
            }
        })

    }

    draw() {
        var thisclass = this;
        var title = document.createElement("div");
        var textnode = document.createTextNode(this.schema.label);
        title.appendChild(textnode)
        this.container.appendChild(title)
        var setFormVal = function(key, val) {
            document.getElementById(key).value = val;
        }
        this.schema.elements.forEach(function(section) {

            var sectiondiv = document.createElement("section");
            sectiondiv.setAttribute("class", "section")
            if (section.frame) {
                var frame = section.frame;
                var framediv = document.createElement("div");
                framediv.setAttribute("bgcolor", frame.headerFillColor)
                framediv.setAttribute("color", frame.labelColor)

                framediv.setAttribute("style", "border: " + frame.lineThick + " solid " + frame.lineColor + "; background-color:" + frame.headerFillColor + "; color:" + frame.labelColor + "; padding:" + frame.headerHeight)
                var framelabel = document.createTextNode(frame.label);
                framediv.appendChild(framelabel);
                sectiondiv.appendChild(framediv);

            }
            section.rows.forEach(function(row) {
                // Row

                var rowdiv = document.createElement("div");
                switch (row.type) {
                case "table":
                    var colsum = [];
                    row.fields.forEach(function(column, index) {
                        //Fields
                        if (column.sumary) {
                            var colus = {
                                destinationRow: 0,
                                reversedRowCoords: true,
                                destinationColumn: index,
                                type: column.sumary
                            }
                            colsum.push(colus)
                        }
                    })
                    var tablediv = document.createElement("div");
                    tablediv.setAttribute("id", "hot");
                    rowdiv.appendChild(tablediv);
                    var dict = {};
                    row.fields.forEach(function(field, index) {
                        dict[field.data] = field;
                        if (field.type == "autocomplete") {
                            if (field.dataurl && field.datadisplay && field.datareturn && field.datalength) {
                                field.source = function(query, process) {
                                    var acRow = this;
                                    if (query.length >= field.datalength) {
                                        var request = new XMLHttpRequest();
                                        request.onreadystatechange = function(response) {
                                            if (request.readyState === 4) {
                                                if (request.status === 200) {
                                                    var jsonOptions = JSON.parse(request.responseText);
                                                    if (field.datadepth) {
                                                        jsonOptions = eval("jsonOptions." + field.datadepth);
                                                    }
                                                    var display = [];
                                                    jsonOptions.forEach(function(item) {
                                                        display.push(eval(field.datadisplay));
                                                    });
                                                    acRow.instance.setCellMetaObject(acRow.row, acRow.col, {
                                                        data: jsonOptions,
                                                        pivot: field.datadisplay.split(".")[1]
                                                    });
                                                    process(display);
                                                } else {
                                                    console.err("cant fetch data");
                                                }
                                            }
                                        }
                                        ;

                                        request.open(field.datamethod, field.dataurl, true);

                                        if (field.datamethod == "POST") {
                                            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                                            request.send(JSON.stringify(field.dataquery));
                                        } else
                                            request.send();
                                    }
                                }

                            }
                        }
                    });

                    row.fields[1].options = {
                        items: Infinity
                    };

                    var hotElement = tablediv;
                    var hotElementContainer = rowdiv;
                    var hotSettings = {
                        columnSummary: colsum,
                        columns: row.fields,
                        contextMenu: true,
                        manualColumnResize: true,
                        columnSorting: true,
                        afterChange: function(change, source) {
                            var hotable = this;
                            if (change) {
                                var metaData = hotable.getCellMeta(change[0][0], hotable.propToCol(change[0][1]));
                                if (metaData.data && metaData.pivot) {
                                    for (var i = 0; i < metaData.data.length; i++) {
                                        if (change[0][3] == metaData.data[i][metaData.pivot]) {
                                            for (var key in metaData.data[i]) {
                                                hotable.setDataAtRowProp(change[0][0], key, metaData.data[i][key], "auto");
                                            }
                                            break;
                                        }
                                    }
                                }
                                if (dict[change[0][1]]) {
                                    if (dict[change[0][1]].fire) {
                                        dict[change[0][1]].fire.split(",").forEach(function(fired, index) {
                                            if (dict[fired].expression) {
                                                hotable.setDataAtRowProp(change[0][0], fired, eval(dict[fired].expression), "auto");

                                                function col(col) {
                                                    return hotable.getDataAtProp(col)[change[0][0]];
                                                }

                                                function form(f) {
                                                    return Number(document.getElementById(f).value);
                                                }
                                            }
                                        })
                                    }
                                    if (dict[change[0][1]].sumform) {
                                        dict[change[0][1]].sumform.forEach(function(data, i) {
                                            var sum = 0;
                                            hotable.getDataAtProp(change[0][1]).forEach(function(obj, index) {
                                                if (typeof obj == 'number')
                                                    sum = +obj;
                                            })

                                            setFormVal(data, sum);
                                        });

                                    }

                                }
                            }
                        }
                    };

                    sectiondiv.appendChild(rowdiv);
                    var hot = new Handsontable(hotElement,hotSettings);
                    break;
                case "row":
                    rowdiv.setAttribute("class", "row");
                    row.fields.forEach(function(field) {

                        var fielddiv = document.createElement("div");
                        fielddiv.setAttribute("class", "fielddiv");
                        //fielddiv.style.setProperty("display","inline","")

                        var label = document.createElement("label");
                        //label.style.setProperty("display","block")
                        label.setAttribute("class", "label")

                        var textlabel = document.createTextNode(field.label ? field.label : "");
                        label.appendChild(textlabel);

                        if (field.required) {
                            var abbr = document.createElement("abbr");
                            var req = document.createTextNode("*");
                            abbr.appendChild(req);
                            abbr.setAttribute("title", "Requerido");
                            abbr.setAttribute("class", "required");
                            label.appendChild(abbr);
                        }

                        var input = document.createElement("input");
                        input.onchange = function() {
                            thisclass.data[field.key] = input.value;
                        }
                        input.value = field.defaultValue ? field.defaultValue : "";
                        thisclass.data[field.key] = input.value;
                        switch (field.type) {
                        case "list":
                            input = document.createElement("select");
                            input.setAttribute("class", "input")
                            field.list.forEach(function(option) {
                                var optiontag = document.createElement("option");
                                var optiontext = document.createTextNode(option.label);
                                optiontag.appendChild(optiontext);
                                optiontag.setAttribute("value", option.value);
                                input.appendChild(optiontag);
                            })
                            thisclass.data[field.key] = input.options[input.selectedIndex].value;
                            input.onchange = function() {
                                thisclass.data[field.key] = input.options[input.selectedIndex].value;
                            }
                            break;
                        case "autocomplete":

                            input.setAttribute("class", "input");
                            input.setAttribute("list", field.key);

                            input.onblur = function(e) {
                                if (input.lastinput == 'insertText')
                                    input.value = '';
                            }

                            input.onselect = function(e) {
                                console.log(e);
                            }

                            var datalist = document.createElement("datalist");
                            datalist.setAttribute("id", field.key)

                            if (field.data) {
                                field.data.forEach(function(option) {
                                    var optiontag = document.createElement("option");
                                    var optiontext = document.createTextNode(option.label);
                                    optiontag.appendChild(optiontext);
                                    optiontag.setAttribute("value", option.value);
                                    datalist.appendChild(optiontag);
                                });
                            }
                            fielddiv.appendChild(datalist);
                            input.oninput = function(e) {
                                console.log(e);
                                input.lastinput = e.inputType;
                                if (e.inputType != "insertText")
                                    return;
                                if (field.dataurl && field.datadisplay && field.datareturn && field.datalength) {
                                    if (e.target.value.length >= field.datalength) {
                                        var request = new XMLHttpRequest();
                                        request.onreadystatechange = function(response) {
                                            if (request.readyState === 4) {
                                                if (request.status === 200) {
                                                    datalist.innerHTML = '';
                                                    var jsonOptions = JSON.parse(request.responseText);

                                                    if (field.datadepth) {
                                                        jsonOptions = eval("jsonOptions." + field.datadepth);
                                                    }

                                                    jsonOptions.forEach(function(item) {
                                                        var option = document.createElement('option');
                                                        option.value = eval(field.datadisplay);
                                                        datalist.appendChild(option);
                                                    });
                                                    input.placeholder = "Escribe";
                                                } else
                                                    input.placeholder = "Couldn't load datalist options";

                                            }
                                        }
                                        ;
                                        input.placeholder = "Cargando...";
                                        while (datalist.firstChild)
                                            datalist.removeChild(datalist.firstChild);

                                        request.open(field.datamethod, field.dataurl, true);

                                        var query = Object.create(field.dataquery);

                                        for (var key in query)
                                            if (query[key] == "_QUERY")
                                                query[key] = input.value;
                                            else
                                                query[key] = query[key]

                                        if (field.datamethod == "POST") {
                                            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                                            request.send(JSON.stringify(query));
                                        } else
                                            request.send();
                                    }
                                }
                            }
                            break;
                        case "radio":
                            input = document.createElement("div");
                            input.setAttribute("style", "display: inline;")
                            input.setAttribute("class", "input")
                            field.list.forEach(function(option) {
                                var optiontag = document.createElement("input");
                                var optiontext = document.createTextNode(option.label);
                                input.appendChild(optiontext);
                                optiontag.setAttribute("value", option.value);
                                optiontag.setAttribute("type", "radio");
                                optiontag.setAttribute("name", field.key);
                                input.appendChild(optiontag);
                            })
                            break;
                        case "hidden":
                            input.setAttribute("type", "hidden");
                            //fielddiv.setAttribute("class", "hidden")
                            input.setAttribute("class", "input")
                            fielddiv.style.setProperty('width', field.width, '');
                            break;
                        case "date":
                            input.setAttribute("type", "date");
                            input.setAttribute("class", "input")
                            flatpickr(input, {});
                            break;
                        case "file":

                            input.setAttribute("type", "file");
                            input.setAttribute("class", "input")

                            var displayinput = document.createElement("input")
                            displayinput.setAttribute("type", "hidden");
                            displayinput.setAttribute("id", field.key);

                            input.onchange = function() {
                                AWS.config.update({
                                    region: field.s3BucketRegion,
                                    credentials: new AWS.CognitoIdentityCredentials({
                                        IdentityPoolId: field.s3IdentityPoolId
                                    })
                                });

                                var s3 = new AWS.S3({
                                    apiVersion: '2006-03-01',
                                    params: {
                                        Bucket: field.s3BucketName
                                    }
                                });

                                var files = input.files;
                                if (!files.length) {
                                    return alert('Please choose a file to upload first.');
                                }
                                var file = files[0];
                                var fileName = file.name;
                                var albumPhotosKey = 'filesuploaded' + '/';

                                var photoKey = albumPhotosKey + fileName;
                                s3.upload({
                                    Key: photoKey,
                                    Body: file,
                                    ACL: 'public-read'
                                }, function(err, data) {
                                    displayinput.setAttribute("type", "text");
                                    if (err) {
                                        console.log(err);
                                        displayinput.value = 'There was an error uploading your photo: ' + err;
                                        return false;
                                    }
                                    displayinput.value = data.Location;
                                    input.parentElement.appendChild(displayinput);
                                });
                            }

                            break;
                        default:
                            input.setAttribute("type", "text");
                            break;

                        }

                        input.setAttribute("id", field.key);

                        if (field.width)
                            input.style.setProperty('width', field.width, '');

                        input.style.setProperty('padding', 'inherit', '');
                     
                        fielddiv.appendChild(label);
                        fielddiv.appendChild(input);
                        rowdiv.appendChild(fielddiv);

                    });
                    sectiondiv.appendChild(rowdiv);
                    break;
                case "textarea":
                    var input = document.createElement("div");
                    //new Quill(input,{ theme: 'snow' });
                    input.setAttribute("class", "editor")
                    rowdiv.appendChild(input);
                    sectiondiv.appendChild(rowdiv);
                    break;
                }

            });
            thisclass.container.appendChild(sectiondiv)
            thisclass.quill = new Quill('.editor',{
                theme: 'snow'
            });

            //console.log(thisclass.quill)
        });

    }

    getURL(url, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function(response) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    callback(null, request.responseText);
                } else {
                    callback({
                        status: request.status,
                        err: "cant fetch data"
                    }, null)
                }
            }
        }
        ;
        request.open('GET', url, true);
        request.send();
    }

    getData(field) {
        if (field)
            return this.data[field];
        else
            return this.data;
    }

    print() {
        var myWindow = window.open('', 'my div', 'height=400,width=600');
        myWindow.document.write('<html><head><title>my div</title>');
        /*optional stylesheet*/
        //myWindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
        myWindow.document.write('</head><body >');
        myWindow.document.write(this.container.innerHTML);
        myWindow.document.write('</body></html>');
        myWindow.document.close();
        // necessary for IE >= 10
        myWindow.onload = function() {
            // necessary if the div contain images

            myWindow.focus();
            // necessary for IE >= 10
            myWindow.print();
            myWindow.close();
        }
        ;
        return true;
    }

}
