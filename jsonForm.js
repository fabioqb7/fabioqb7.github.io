class FormJSON {

    constructor(json, cont, cbdraw) {
        var thisclass = this;
        thisclass.data = {};

        this.fields = {};
        this.quills = [];
        this.enable = true;
        this.alerts = true;
        this.requiredMsg = [];

        this.afterdraw = cbdraw;

        if (cont)
            thisclass.container = document.getElementById(cont);
        else
            thisclass.container = document.getElementById("formJSON");

        this.jsfiles = ["https://cdn.jsdelivr.net/npm/flatpickr", "https://cdn.quilljs.com/1.3.6/quill.js", "https://cdn.jsdelivr.net/npm/handsontable@6.2.2/dist/handsontable.full.min.js", "https://sdk.amazonaws.com/js/aws-sdk-2.283.1.min.js"];

        this.cssfiles = ["https://fabioqb7.github.io/jsonForm.css", "https://cdn.jsdelivr.net/npm/handsontable-pro@6.2.2/dist/handsontable.full.min.css", "https://cdn.quilljs.com/1.3.6/quill.snow.css", "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"];

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
                thisclass.container.appendChild(script);
            } else
                callback();

        }

        loadjs(function() {
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
        this.form = document.createElement("form");
        this.form.setAttribute("onsubmit", "return false;");
        this.container.appendChild(this.form);
        this.container.style.position = 'absolute';

        var setFormVal = function(key, val) {
            document.getElementById(key).value = val;
        }

        for (var k = 0; k < this.schema.elements.length; k++) {
            var section = this.schema.elements[k];

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
            for (var ir = 0; ir < section.rows.length; ir++) {
                var row = section.rows[ir];
                //section.rows.forEach(function (row) {
                // Row
                var rowdiv = document.createElement("div");
                switch (row.type) {
                case "table":
                    var colsum = [];
                    thisclass.fields[row.key];
                    row.fields.forEach(function(column, index) {
                        if (column.sumary) {
                            var colus = {
                                destinationRow: 0,
                                reversedRowCoords: true,
                                destinationColumn: index,
                                type: column.sumary,
                                readOnly: true
                            }
                            colsum.push(colus)
                        }
                    })
                    var tablediv = document.createElement("div");
                    tablediv.setAttribute("id", "hot");
                    rowdiv.appendChild(tablediv);
                    var dict = {};
                    var required = [];

                    row.fields.forEach(function(field, index) {
                        dict[field.data] = field;

                        if (field.required)
                            required.push(field);

                        if (field.type == "autocomplete") {
                            if (field.dataurl && field.datadisplay && field.datareturn && field.datalength) {
                                field.source = function(search, process) {
                                    process;
                                    var acRow = this;
                                    if (search.length >= field.datalength) {
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

                                        if (field.dataquery) {
                                            var query = Object.create(field.dataquery);

                                            for (var key in query)
                                                if (query[key] == "_QUERY")
                                                    query[key] = search;
                                                else
                                                    query[key] = query[key]
                                        }

                                        if (field.datamethod == "POST") {
                                            request.open(field.datamethod, field.dataurl, true);
                                            request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                                            request.send(JSON.stringify(query));
                                        } else {
                                            var str = "?";
                                            for (var key in query) {
                                                if (str != "") {
                                                    str += "&";
                                                }
                                                str += key + "=" + encodeURIComponent(query[key]);
                                            }
                                            request.open(field.datamethod, field.dataurl + str, true);
                                            request.send();
                                        }
                                    }
                                }

                            }
                        }

                    })

                    row.fields[1].options = {
                        items: Infinity
                    };

                    var hotElement = tablediv;
                    var hotElementContainer = rowdiv;
                    var hotSettings = {
                        columns: row.fields,
                        contextMenu: true,
                        rowHeaders: true,
                        manualColumnResize: true,
                        columnSorting: true,
                        afterChange: function(change, source) {
                            var hotable = this;
                            var dict = hotable.dict;
                            if (change) {
                                var metaData = hotable.getCellMeta(change[0][0], hotable.propToCol(change[0][1]));
                                if (metaData.data && metaData.pivot) {
                                    for (var i = 0; i < metaData.data.length; i++) {
                                        if (change[0][3] == metaData.data[i][metaData.pivot]) {
                                            for (var key in metaData.data[i]) {
                                                hotable.setDataAtRowProp(change[0][0], change[0][1] + '_' + key, metaData.data[i][key], "auto");
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
                                                    sum = sum + obj;
                                            })
                                            if (dict[change[0][1]].numericFormat) {
                                                setFormVal(data, numbro(sum).format(dict[change[0][1]].numericFormat.pattern || '0'));
                                            } else {
                                                setFormVal(data, numbro(sum).format('0'));
                                            }

                                        });

                                    }

                                }
                            }

                            thisclass.data[row.id ? row.id : 'table'] = hotable.getData();
                        }
                    };

                    sectiondiv.appendChild(rowdiv);
                    var hot = new Handsontable(hotElement,hotSettings);
                    hot.dict = dict;
                    hot.required = required;
                    thisclass.fields[row.key ? row.key : row.table] = {
                        element: hot,
                        type: 'table',
                        table: row.table,
                        field: field
                    }
                    break;
                case "row":
                    rowdiv.setAttribute("class", "rowjf");
                    for (var inf = 0; inf < row.fields.length; inf++) {
                        var field = row.fields[inf];
                        var fielddiv = document.createElement("div");
                        fielddiv.setAttribute("class", "fielddiv");

                        var label = document.createElement("label");
                        label.setAttribute("class", "label")

                        var textlabel = document.createTextNode(field.label ? field.label : "");
                        label.appendChild(textlabel);

                        var input = document.createElement("input");

                        if (field.required) {
                            var abbr = document.createElement("abbr");
                            var req = document.createTextNode("*");
                            abbr.appendChild(req);
                            abbr.setAttribute("title", "Requerido");
                            abbr.setAttribute("class", "required");
                            label.appendChild(abbr);
                            input.required = true;
                        }

                        input.onchange = function() {
                            thisclass.data[field.key] = input.value;
                        }
                        input.value = field.defaultValue ? field.defaultValue : "";
                        thisclass.data[field.key] = input.value;
                        switch (field.type) {
                        case "list":
                            input = document.createElement("select");
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'list',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
                            input.setAttribute("class", "input")
                            field.list.forEach(function(option) {
                                var optiontag = document.createElement("option");
                                var optiontext = document.createTextNode(option.label);
                                optiontag.appendChild(optiontext);
                                optiontag.setAttribute("value", option.value);
                                input.appendChild(optiontag);

                                if (field.defaultValue) {
                                    if (field.defaultValue == option.value)
                                        optiontag.setAttribute("selected", "selected");

                                }
                            })

                            input.style.setProperty('-webkit-appearance', 'menulist', '');
                            thisclass.data[field.key] = input.options[input.selectedIndex].value;
                            input.onchange = function() {
                                thisclass.data[field.key] = this.options[this.selectedIndex].value;
                            }
                            break;
                        case "autocomplete":

                            input = document.createElement("div");
                            input.setAttribute("class", "input");
                            input.setAttribute("class", "autocomplete");
                            input.setAttribute("autocomplete", "off");

                            var inputbox = document.createElement("input");
                            inputbox.setAttribute("id", field.key);
                            inputbox.setAttribute("palceholder", field.label);
                            inputbox.setAttribute("autocomplete", "off");
                            inputbox.fieldSetts = field;

                            inputbox.required = field.required;

                            inputbox.style.setProperty('width', field.width, '');

                            thisclass.fields[field.key] = {
                                element: inputbox,
                                type: 'autocomplete',
                                table: field.table ? field.table : row.table,
                                field: field
                            }

                            thisclass.autocomplete(inputbox, field.data, thisclass.fields[field.key]);
                            input.appendChild(inputbox);
                            break;
                        case "radio":
                            input = document.createElement("div");
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'radio',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
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
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'hidden',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
                            input.setAttribute("type", "hidden");
                            //fielddiv.setAttribute("class", "hidden")
                            input.setAttribute("class", "input")
                            fielddiv.style.setProperty('width', field.width, '');
                            break;
                        case "date":
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'date',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
                            input.setAttribute("type", "date");
                            input.setAttribute("class", "input")
                            flatpickr(input, field.dateoptions ? field.dateoptions : {});
                            break;
                        case "numeric":
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'number',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
                            input.setAttribute("type", "number");
                            input.setAttribute("step", "any");
                            input.setAttribute("class", "input")
                            input.field = field;


                            input.onchange = function(e) {
                                    var target = e.target;
                                    var form = function(field){
                                            return Number(thisclass.getField(field));
                                    }
                                    if(target.field.fire){
                                        var fieldDest=thisclass.fields[target.field.fire];
                                        if(fieldDest.field.expression){
                                                fieldDest.element.value = eval (fieldDest.field.expression);
                                        }
                                    }
                                    
                            };


                            break;
                        case "file":
                            input.setAttribute("type", "file");
                            input.setAttribute("class", "input")

                            var displayinput = document.createElement("input")
                            thisclass.fields[field.key] = {
                                element: displayinput,
                                input: input,
                                type: 'file',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
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
                            thisclass.fields[field.key] = {
                                element: input,
                                type: 'text',
                                table: field.table ? field.table : row.table,
                                field: field
                            }
                            break;

                        }
                        input.setAttribute("id", field.key);

                        if (field.disabled) {
                            input.disabled = true;
                        }

                        if (field.width)
                            input.style.setProperty('width', field.width, '');

                        input.style.setProperty('padding', 'inherit', '');

                        fielddiv.appendChild(label);
                        fielddiv.appendChild(input);
                        rowdiv.appendChild(fielddiv);

                    }
                    sectiondiv.appendChild(rowdiv);
                    break;
                case "textarea":
                    var input = document.createElement("div");

                    thisclass.quills.push({
                        element: input,
                        key: row.key
                    })

                    var fv = {};
                    fv.element = input;
                    fv.type = "quill";
                    fv.table = row.table;
                    fv.field = row;
                    thisclass.fields[row.key] = fv;

                    input.setAttribute("class", "editor")
                    rowdiv.appendChild(input);
                    sectiondiv.appendChild(rowdiv);
                    break;
                }

            }

            thisclass.form.appendChild(sectiondiv);

            try {
                for (var i = 0; i < thisclass.quills.length; i++) {
                    var obj = thisclass.quills[i];
                    var quill = new Quill(obj.element,{
                        theme: 'snow',
                        placeholder: 'Escribe aquí ...'
                    });
                    thisclass.fields[obj.key].element = quill;
                    quill.setText('\n\n\n\n\n');
                }
            } catch (ex) {
                console.log(ex)
            }

        }

        if (thisclass.afterdraw)
            thisclass.afterdraw();

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

    getField(key) {
        var field = this.fields[key];
        var element = field.element;
        var result = "";
        var self = this;
        switch (field.type) {
        case "table":
            var res = [];
            result = element.getSourceData();
            var rowcount = 0;
            for (var i = 0; i < result.length; i++) {
                var item = null;
                var row = result[i];
                for (var key in row) {
                    var prop = row[key];
                    if (prop) {
                        if (!item)
                            item = {
                                row: i
                            };
                        item[key] = prop;
                    }

                    /*
                    if (!prop || prop == '') {
                        if (element.dict[key])
                            if (element.dict[key].required) {
                                self.validity = self.validity && false;
                                console.log("required col: ", key);
                            }
                    }*/

                }
                if (item) {
                    item.row = rowcount;
                    rowcount++;
                    res.push(item);

                    for (var j = 0; j < element.required.length; j++) {
                        var prop = element.required[j];

                        if (!item.hasOwnProperty(prop.data)) {
                            self.validity = self.validity && false;
                            this.requiredMsg.push(" La columna " + prop.title + " no puede ser vacía en la fila: " + (i + 1));
                            console.log("required col: ", prop);
                        }
                    }

                }

            }
            result = res;
            break;
        case "list":
            result = element.options[element.selectedIndex].value;
            break;
        case "autocomplete":
            if (field.field.datareturn && field.value) {
                var item = field.value;
                result = eval(field.field.datareturn);
            } else
                result = element.value;
            break;
        case "radio":
            var radios = document.getElementsByName(key);
            for (var i = 0, length = radios.length; i < length; i++) {
                if (radios[i].checked) {
                    result = radios[i].value;
                    break;
                }
            }
            break;
        case "hidden":
            result = element.value;
            break;
        case "date":
            result = element.value;
            break;
        case "file":
            result = element.value;
            break;
        case "quill":
            result = element.getText();
            break;
        default:
            result = element.value;
            break;
        }

        return result;

    }

    getData(field) {

        this.validity = true;
        this.form.requestSubmit();
        this.requiredMsg = [];

        if (field)
            return this.getField(field)
        else {
            var data = {};

            for (var key in this.fields) {
                var item = this.fields[key];
                var value = this.getField(key);
                data[key] = value;

                if (!value)
                    if (item.field.required) {
                        this.validity = this.validity && false;
                        this.requiredMsg.push("El campo " + item.field.label + " es obligatorio.");
                        console.log("required:", item.field.key);
                    }
            }

            if (!this.validity) {
                console.log("validity", this.validity);
                if (this.alerts) {
                    alert(this.requiredMsg.join("\n"));
                }
            }

            return data;

        }
    }

    setData(one, two) {
        if (one && two)
            return this.setField(one, two);
        else {
            var data = {};
            for (var key in one) {
                data[key] = this.setField(key, one[key]);
            }
            return data;
        }
    }

    setField(key, data) {
        var field = this.fields[key];
        if (!field) {
            console.log("field not found: " + key);
            return;
        }

        var element = field.element;
        var result = "";
        switch (field.type) {
        case "table":
            result = element.loadData(data)
            break;
        case "list":
            element.value = data;
            result = data;
            break;
        case "autocomplete":
            var item = JSON.parse(data);
            if (typeof item == 'object') {
                field.value = item;
                if (field.field.datadisplay) {
                    data = eval(field.field.datadisplay)
                }
            }
            result = element.value = data;
            break;
        case "radio":
            var radios = document.getElementsByName(key);
            for (var i = 0, length = radios.length; i < length; i++) {
                if (radios[i].checked) {
                    result = radios[i].checked = true;
                    break;
                }
            }
            break;
        case "hidden":
            result = element.value = data;
            break;
        case "date":
            result = element.value = data;
            break;
        case "file":
            result = element.value = data;
            break;
        case "quill":
            result = element.setText(data)
            break;
        default:
            result = element.value = data;
            break;
        }
        return result;
    }

    getDataByTable() {

        this.getData();

        var data = {};
        for (var key in this.fields) {
            var item = this.fields[key];
            if (!data[item.table])
                data[item.table] = {};

            var dat = this.getField(key);
            if (Array.isArray(dat))
                data[item.table] = dat;
            else
                data[item.table][key] = dat;
        }
        return data;
    }

    setEnable(bol) {

        if (bol) {
            for (var key in this.fields) {
                var item = this.fields[key];

                if (item.field.disabled)
                    continue;

                switch (item.type) {
                case "table":
                    item.element.updateSettings({
                        readOnly: false
                    });
                    break;
                case "quill":
                    item.element.enable(true);
                    break;
                case "file":
                    item.input.disabled = false;
                    break;
                default:
                    item.element.disabled = false;
                    break;
                }
            }
            this.enable = true;

        } else {
            for (var key in this.fields) {
                var item = this.fields[key];

                if (item.field.disabled)
                    continue;

                switch (item.type) {
                case "table":
                    item.element.updateSettings({
                        readOnly: true
                    });
                    break;
                case "quill":
                    item.element.enable(false);
                    break;
                case "file":
                    item.input.disabled = true;
                    break;
                default:
                    item.element.disabled = true;
                    break;
                }

            }
            this.enable = false;

        }

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

    autocomplete(inp, arr, fieldd) {
        var thisclass = this;
        /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
        var currentFocus;
        /*execute a function when someone writes in the text field:*/
        inp.addEventListener("input", function(e) {
            var a, b, i, val = this.value;
            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) {
                return false;
            }
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);
            /*for each item in the array...*/

            if (arr)
                populate(arr);

            const fieldA = e.target.fieldSetts;
            var input = e.target;
            if (fieldA.dataurl && fieldA.datadisplay && fieldA.datareturn && fieldA.datalength) {

                if (e.target.value.length >= fieldA.datalength) {
                    var request = new XMLHttpRequest();
                    fieldA.requestInput = request;
                    request.onreadystatechange = function(response) {
                        if (request.readyState === 4) {
                            if (request.status === 200) {
                                var jsonOptions = JSON.parse(request.responseText);
                                if (fieldA.datadepth) {
                                    jsonOptions = eval("jsonOptions." + fieldA.datadepth);
                                }

                                populate(jsonOptions.map(function(item) {
                                    return eval(fieldA.datadisplay)
                                }), jsonOptions);

                            } else {
                                input.placeholder = "Couldn't load datalist options";
                            }

                        }
                    }

                    if (fieldA.dataquery) {
                        var query = Object.create(fieldA.dataquery);

                        for (var key in query)
                            if (query[key] == "_QUERY")
                                query[key] = input.value;
                            else
                                query[key] = query[key]
                    }

                    if (fieldA.datamethod == "POST") {
                        request.open(fieldA.datamethod, fieldA.dataurl, true);
                        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                        request.send(JSON.stringify(query));
                    } else {
                        var str = "?";
                        for (var key in query) {
                            if (str != "") {
                                str += "&";
                            }
                            str += key + "=" + encodeURIComponent(query[key]);
                        }
                        request.open(fieldA.datamethod, fieldA.dataurl + str, true);
                        request.send();
                    }

                }
            }

            function populate(arr, objs) {
                for (i = 0; i < arr.length; i++) {
                    /*check if the item starts with the same letters as the text field value:*/
                    if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                        /*create a DIV element for each matching element:*/
                        b = document.createElement("DIV");
                        /*make the matching letters bold:*/
                        b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                        b.innerHTML += arr[i].substr(val.length);
                        /*insert a input field that will hold the current array item's value:*/
                        b.innerHTML += "<input type='hidden' value='" + arr[i] + "' index='" + i + "'>";
                        /*execute a function when someone clicks on the item value (DIV element):*/
                        b.addEventListener("click", function(e) {
                            /*insert the value for the autocomplete text field:*/
                            fieldd.value = objs[this.getElementsByTagName("input")[0].getAttribute("index")];
                            inp.value = this.getElementsByTagName("input")[0].value;
                            /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
                            closeAllLists();
                        });
                        a.appendChild(b);
                    }
                }
            }

        });
        /*execute a function presses a key on the keyboard:*/
        inp.addEventListener("keydown", function(e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x)
                x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
                currentFocus++;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 38) {
                //up
                /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
                currentFocus--;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 13) {
                /*If the ENTER key is pressed, prevent the form from being submitted,*/
                e.preventDefault();
                if (currentFocus > -1) {
                    /*and simulate a click on the "active" item:*/
                    if (x)
                        x[currentFocus].click();
                }
            }
        });
        function addActive(x) {
            /*a function to classify an item as "active":*/
            if (!x)
                return false;
            /*start by removing the "active" class on all items:*/
            removeActive(x);
            if (currentFocus >= x.length)
                currentFocus = 0;
            if (currentFocus < 0)
                currentFocus = (x.length - 1);
            /*add class "autocomplete-active":*/
            x[currentFocus].classList.add("autocomplete-active");
        }
        function removeActive(x) {
            /*a function to remove the "active" class from all autocomplete items:*/
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        function closeAllLists(elmnt) {
            /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        /*execute a function when someone clicks in the document:*/
        document.addEventListener("click", function(e) {
            closeAllLists(e.target);
        });
    }
}
