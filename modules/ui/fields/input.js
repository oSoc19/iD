import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select, event as d3_event } from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { dataPhoneFormats } from '../../../data';
import { services } from '../../services';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';

//Siema is the image carousel library used for the marker image carousel feature
import Siema from 'siema';

import * as createImageModal from './addImageModal';

import { login } from '../tools/uploadToWikimedia';
import * as WikiMediaService from '../tools/uploadToWikimedia';

export {
    uiFieldText as uiFieldUrl,
    uiFieldText as uiFieldNumber,
    uiFieldText as uiFieldTel,
    uiFieldText as uiFieldEmail
};

export function uiFieldText(field, context) {
    var dispatch = d3_dispatch('change');
    var nominatim = services.geocoder;
    var input = d3_select(null);
    var _entity;

    function i(selection) {
        var preset =
            _entity && context.presets().match(_entity, context.graph());
        var isLocked = preset && preset.suggestion && field.id === 'brand';
        field.locked(isLocked);

        var wrap = selection.selectAll('.form-field-input-wrap').data([0]);

        wrap = wrap
            .enter()
            .append('div')
            .attr(
                'class',
                'form-field-input-wrap form-field-input-' + field.type
            )
            .merge(wrap);

        var fieldID = 'preset-input-' + field.safeid;

        input = wrap.selectAll('input').data([0]);

        input = input
            .enter()
            .append('input')
            .attr('type', field.type)
            .attr('id', fieldID)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .classed(field.type, true)
            .call(utilNoAuto)
            .merge(input);

        // Open Heritage Map: Display and adding marker image(s)
        let inputImageField = document.getElementById('preset-input-image');

        // If we have an inputImageField, try to fetch is value, which is a comma-separated
        // list of image links.
        let imagesURL = inputImageField ? inputImageField.value : null;
        let renderedImage = document.getElementsByClassName('rendered-image');

        var parentDiv = document.getElementById('image-inputs');

        if (imagesURL && imagesURL !== '' && (renderedImage.length == 0)) {
            // Split imagesURL-value into seperate URLS
            imagesURL = imagesURL.split(',');

            wrap
                //add image container
                .append('div')
                .attr('class', 'image-view-box siema')
                .merge(wrap);

            wrap
                //add image carousel buttons containers
                .append('div')
                .attr('class', 'image-buttons')
                .merge(wrap);

            var imageButtons = selection.selectAll('.image-buttons');

            //add image carousel buttons
            imageButtons
                .append('button')
                .attr('class', 'btn-carousel btn-prev fas fa-chevron-left')
                .merge(imageButtons);

            imageButtons
                .append('button')
                .attr('class', 'btn-carousel btn-next fas fa-chevron-right')
                .merge(imageButtons);

            for (var i = 0; i < imagesURL.length; i++) {
                //select the image container
                var imageViewBox = selection.selectAll('.image-view-box');

                imageViewBox
                    //add image tag inside container for each URL
                    .append('img')
                    .attr('src', imagesURL[i])
                    .attr('class', 'rendered-image imageslide')
                    .merge(imageViewBox);
            }
            //Initiate image carousel
            var initSiema = new Siema({
                selector: '.siema',
                draggable: true,
                loop: true
            });
            //Carousel buttons functionality
            document
                .querySelector('.btn-prev')
                .addEventListener('click', function () {
                    initSiema.prev();
                });
            document
                .querySelector('.btn-next')
                .addEventListener('click', function () {
                    initSiema.next();
                });

            //Add image feature
            document.querySelector('.btn-add-image').addEventListener('click', addImage);
            var container = document.getElementById('id-container');
            var header = document.getElementById('header-map');
            var modal = document.getElementById('add-image-modal');
            function addImage() {
                var pictures;
                WikiMediaService.login();
                document.getElementById('sendThePictureToWikimedia').onclick = function () {
                    if (document.getElementById('submitPicture').files[0]) {
                        pictures = document.getElementById('submitPicture').files[0];
                        var name = document.getElementById('preset-input-name').value;
                        WikiMediaService.upload(pictures, name);
                    } else {
                        alert(t("add-image-modal.abort"));
                    }
                };
                //Make modal window visible and let background blur when "add image" button is clicked
                container.classList.add('blur');
                header.classList.add('blur');
                modal.classList.add('show');
            }
            document.querySelector('.modal-close').addEventListener('click', closeModal);
            function closeModal() {
                //Hide modal window when close button is clicked
                container.classList.remove('blur');
                header.classList.remove('blur');
                modal.classList.remove('show');
            }
        }

        // Add the "add image" button if we got an image field (and if we don't already have a btn-add-image)
        if (inputImageField && (document.getElementsByClassName('btn-add-image').length == 0)) {
            parentDiv = (parentDiv != null) ? parentDiv : inputImageField.parentElement;
            //Create image modal window
            //Check rendering in addImageModal.js
            createImageModal.createAddImageButton(parentDiv);
            createImageModal.createModal();

            //Add image feature
            document.querySelector('.btn-add-image').addEventListener('click', addImage);
            var container = document.getElementById('id-container');
            var header = document.getElementById('header-map');
            var modal = document.getElementById('add-image-modal');
            function addImage() {
                var pictures;
                // This function is called by an eventHandler when we press the button, we then request to our online service that we can start to fetch the login on wikimedia
                WikiMediaService.login();
                document.getElementById('sendThePictureToWikimedia').onclick = function () {
                    if (document.getElementById('submitPicture').files[0]) {
                        pictures = document.getElementById('submitPicture').files[0];
                        var name = document.getElementById('preset-input-name').value;
                        // When we select a picture and press the `send` button, we can ask our online service to send the picture by giving him, the name of the building + the picture itself
                        WikiMediaService.upload(pictures, name);
                    } else {
                        alert(t("add-image-modal.abort"));
                    }
                }; 
                //Make modal window visible and let background blur when "add image" button is clicked
                container.classList.add('blur');
                header.classList.add('blur');
                modal.classList.add('show');
            }
            document.querySelector('.modal-close').addEventListener('click', closeModal);
            function closeModal() {
                //Hide modal window when close button is clicked
                container.classList.remove('blur');
                header.classList.remove('blur');
                modal.classList.remove('show');
            }
        }

        input
            .classed('disabled', !!isLocked)
            .attr('readonly', isLocked || null)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (field.type === 'tel' && nominatim && _entity) {
            var center = _entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, countryCode) {
                if (err || !dataPhoneFormats[countryCode]) return;
                wrap.selectAll('#' + fieldID).attr(
                    'placeholder',
                    dataPhoneFormats[countryCode]
                );
            });
        } else if (field.type === 'number') {
            var rtl = textDirection === 'rtl';

            input.attr('type', 'text');

            var buttons = wrap
                .selectAll('.increment, .decrement')
                .data(rtl ? [1, -1] : [-1, 1]);

            buttons
                .enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function (d) {
                    var which = d === 1 ? 'increment' : 'decrement';
                    return 'form-field-button ' + which;
                })
                .merge(buttons)
                .on('click', function (d) {
                    d3_event.preventDefault();
                    var raw_vals = input.node().value || '0';
                    var vals = raw_vals.split(';');
                    vals = vals.map(function (v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num + d) : v.trim();
                    });
                    input.node().value = vals.join(';');
                    change()();
                });
        }
    }

    // clamp number to min/max
    function clamped(num) {
        if (field.minValue !== undefined) {
            num = Math.max(num, field.minValue);
        }
        if (field.maxValue !== undefined) {
            num = Math.min(num, field.maxValue);
        }
        return num;
    }

    function change(onInput) {
        return function () {
            var t = {};
            var val = utilGetSetValue(input).trim() || undefined;

            if (!onInput) {
                if (field.type === 'number' && val !== undefined) {
                    var vals = val.split(';');
                    vals = vals.map(function (v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num) : v.trim();
                    });
                    val = vals.join(';');
                }
                utilGetSetValue(input, val || '');
            }
            t[field.key] = val;
            dispatch.call('change', this, t, onInput);
        };
    }

    i.entity = function (val) {
        if (!arguments.length) return _entity;
        _entity = val;
        return i;
    };

    i.tags = function (tags) {
        utilGetSetValue(input, tags[field.key] || '');
    };

    i.focus = function () {
        var node = input.node();
        if (node) node.focus();
    };

    return utilRebind(i, dispatch, 'on');
}