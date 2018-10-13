class FormJSON {

    constructor(json, cont) {
        if (cont)
            this.container = document.getElementById(cont);
        else
            this.container = document.getElementById("formJSON");

        if (typeof json == 'object') {
            this.schema = json;
            this.draw();
        }

        if (typeof json == "string") {
            this.getURL(json, function(err, text) {
                if (!err) {
                    console.log(text)
                    this.schema = JSON.parse(text);
                    this.draw();
                }
            });
        }
    }


    

    draw() {
        var title = document.createElement("div");
        var textnode = document.createTextNode(data.label);
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

                framediv.setAttribute("style", "border: " + frame.lineThick + " solid " + frame.lineColor +
                    "; background-color:" + frame.headerFillColor +
                    "; color:" + frame.labelColor +
                    "; padding:" + frame.headerHeight
                )
                var framelabel = document.createTextNode(frame.label);
                framediv.appendChild(framelabel);
                sectiondiv.appendChild(framediv);

            }
            section.rows.forEach(function(row) { // Row

                var rowdiv = document.createElement("div");
                switch (row.type) {
                    case "table":
                        var colsum = [];
                        row.fields.forEach(function(column, index) { //Fields
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
                                                        var display = [];
                                                        jsonOptions.forEach(function(item) {
                                                            display.push(eval(field.datadisplay));
                                                        });
                                                        acRow.instance.setCellMetaObject(acRow.row, acRow.col, { data: jsonOptions, pivot: field.datadisplay.split(".")[1] });
                                                        process(display);
                                                    } else {
                                                        console.err("cant fetch data");
                                                    }
                                                }
                                            };
                                            request.open('GET', field.dataurl, true);
                                            request.send();
                                        }
                                    }

                                }
                            }
                        });

                        row.fields[1].options = { items: Infinity };

                        var hotElement = tablediv;
                        var hotElementContainer = rowdiv;
                        var hotSettings = {
                            columnSummary: colsum,
                            columns: row.fields,
                            contextMenu: true,
                            manualColumnResize: true,
                            columnSorting: true,
                            afterChange: function(change, source) {
                                hotable = this;
                                if (change) {
                                    var metaData = hotable.getCellMeta(change[0][0], hotable.propToCol(change[0][1]));
                                    if (metaData.data && metaData.pivot) {
                                        for (i = 0; i <= metaData.data.length; i++) {
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
                        var hot = new Handsontable(hotElement, hotSettings);
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
                                    break;

                                case "autocomplete":

                                    input.setAttribute("class", "input");
                                    input.setAttribute("list", field.key);

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
                                    input.onkeyup = function(e) {
                                        if (field.dataurl && field.datadisplay && field.datareturn && field.datalength) {
                                            if (e.target.value.length >= field.datalength) {
                                                var request = new XMLHttpRequest();
                                                request.onreadystatechange = function(response) {
                                                    if (request.readyState === 4) {
                                                        if (request.status === 200) {
                                                            var jsonOptions = JSON.parse(request.responseText);
                                                            jsonOptions.forEach(function(item) {
                                                                var option = document.createElement('option');
                                                                option.value = eval(field.datadisplay);
                                                                datalist.appendChild(option);
                                                            });
                                                            input.placeholder = "Escribe";
                                                        } else
                                                            input.placeholder = "Couldn't load datalist options";

                                                    }
                                                };
                                                input.placeholder = "Cargando...";
                                                while (datalist.firstChild)
                                                    datalist.removeChild(datalist.firstChild);

                                                request.open('GET', field.dataurl, true);
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
                                    fielddiv.setAttribute("class", "hidden")
                                    input.setAttribute("class", "input")
                                    fielddiv.style.setProperty('width', field.width, '');
                                    break;
                                case "date":
                                    input.setAttribute("type", "date");
                                    input.setAttribute("class", "input")
                                    flatpickr(input, {});
                                    break;
                                default:
                                    input.setAttribute("type", "text");
                                    break;

                            }
                            input.setAttribute("id", field.key);

                            if (field.width)
                                input.style.setProperty('width', field.width, '');

                            fielddiv.appendChild(label);
                            fielddiv.appendChild(input);
                            rowdiv.appendChild(fielddiv);

                        });
                        sectiondiv.appendChild(rowdiv);
                        break;
                    case "textarea":
                        input = document.createElement("div");
                        input.setAttribute("class", "editor")
                        rowdiv.appendChild(input);
                        sectiondiv.appendChild(rowdiv);
                        break;
                }

            });
            container.appendChild(sectiondiv)
            var quill = new Quill('.editor', { theme: 'snow' });
        });

    }

    getURL(url, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function(response) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    callback(null, request.responseText);
                } else {
                    callback({ status: request.status, err: "cant fetch data" })
                }
            }
        };
        request.open('GET', url, true);
        request.send();
    }



}