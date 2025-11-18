// Form Builder Class
class FormBuilder {
    constructor() {
        this.formData = {
            id: Date.now(),
            title: '',
            description: '',
            sections: [],
            settings: {
                courseId: '',
                courseDescription: '',
                dueDate: '',
                dueTime: '',
                accessibility: 'public',
                requirePasscode: false,
                passcode: '',
                anonymousEvaluations: true,
                allowDraftSaving: true,
                minTeamSize: 2,
                maxTeamSize: 5,
                studentInstructions: 'Form your team and evaluate each teammate based on the criteria below.',
                allowSelfEvaluation: false
            }
        };
        
        this.activeSection = null;
        this.activeQuestion = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadFormData();
    }

    initializeElements() {
        // Form structure elements
        this.formTitle = document.querySelector('.form-title');
        this.formDescription = document.querySelector('.form-description');
        this.formSections = document.getElementById('formSections');
        this.addSectionBtn = document.getElementById('addSection');

        // Editor panels
        this.defaultEditor = document.getElementById('defaultEditor');
        this.sectionEditor = document.getElementById('sectionEditor');
        this.questionEditor = document.getElementById('questionEditor');

        // Question type options
        this.ratingScaleOptions = document.getElementById('ratingScaleOptions');
        this.textResponseOptions = document.getElementById('textResponseOptions');
        this.choiceOptions = document.getElementById('choiceOptions');
        this.sliderOptions = document.getElementById('sliderOptions');

        // Tab navigation
        this.tabs = document.querySelectorAll('.tab');
    }

    initializeEventListeners() {
        // Form title and description
        this.formTitle.addEventListener('input', (e) => {
            this.formData.title = e.target.value;
            this.autoResizeTextarea(e.target);
            this.saveDraft();
        });

        this.formDescription.addEventListener('input', (e) => {
            this.formData.description = e.target.value;
            this.autoResizeTextarea(e.target);
            this.saveDraft();
        });

        // Add section button - prevent double-click
        if (this.addSectionBtn && !this.addSectionBtn.dataset.listenerAdded) {
            this.addSectionBtn.dataset.listenerAdded = 'true';
            this.addSectionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addSection();
            }, { once: false });
        }

        // Tab navigation - ensure all tabs work
        this.tabs.forEach(tab => {
            if (!tab.dataset.listenerAdded) {
                tab.dataset.listenerAdded = 'true';
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Tab clicked:', tab.dataset.tab);
                    this.switchTab(tab.dataset.tab);
                });
            }
        });

        // Save and publish buttons
        document.getElementById('saveDraft').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishForm').addEventListener('click', () => this.publishForm());

        // Settings event listeners
        this.initializeSettingsListeners();
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    addSection() {
        const section = {
            id: Date.now(),
            title: 'New Section',
            description: '',
            questions: []
        };

        this.formData.sections.push(section);
        this.renderSection(section);
        this.showSectionEditor(section);
        this.saveDraft();
    }

    renderSection(section) {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'section';
        sectionElement.dataset.sectionId = section.id;

        sectionElement.innerHTML = `
            <div class="section__header">
                <h3 class="section__title">${section.title}</h3>
                <button class="btn btn-icon" onclick="formBuilder.deleteSection(${section.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            ${section.description ? `<p class="section__description">${section.description}</p>` : ''}
            <div class="section__questions"></div>
            <div class="question-types">
                <div class="question-type" onclick="formBuilder.addQuestion(${section.id}, 'rating')">
                    <div class="question-type__title">Rating Scale</div>
                    <div class="question-type__description">Numerical rating (1-5, 1-10, etc.)</div>
                </div>
                <div class="question-type" onclick="formBuilder.addQuestion(${section.id}, 'text')">
                    <div class="question-type__title">Text Response</div>
                    <div class="question-type__description">Long-form text input</div>
                </div>
                <div class="question-type" onclick="formBuilder.addQuestion(${section.id}, 'multiple')">
                    <div class="question-type__title">Multiple Choice</div>
                    <div class="question-type__description">Single selection from options</div>
                </div>
                <div class="question-type" onclick="formBuilder.addQuestion(${section.id}, 'checkbox')">
                    <div class="question-type__title">Checkboxes</div>
                    <div class="question-type__description">Multiple selections allowed</div>
                </div>
                <div class="question-type" onclick="formBuilder.addQuestion(${section.id}, 'slider')">
                    <div class="question-type__title">Slider</div>
                    <div class="question-type__description">Continuous scale input</div>
                </div>
            </div>
        `;

        this.formSections.appendChild(sectionElement);
        this.renderQuestions(section);
    }

    deleteSection(sectionId) {
        const index = this.formData.sections.findIndex(s => s.id === sectionId);
        if (index > -1) {
            this.formData.sections.splice(index, 1);
            document.querySelector(`[data-section-id="${sectionId}"]`).remove();
            this.showDefaultEditor();
            this.saveDraft();
        }
    }

    editQuestion(sectionId, questionId) {
        const section = this.formData.sections.find(s => s.id === sectionId);
        if (!section) return;
        
        const question = section.questions.find(q => q.id === questionId);
        if (!question) return;

        // Minimize all questions first
        document.querySelectorAll('.question').forEach(q => {
            q.classList.add('minimized');
            const expanded = q.querySelector('.question__expanded');
            const minimized = q.querySelector('.question__minimized');
            if (expanded) expanded.style.display = 'none';
            if (minimized) minimized.style.display = 'flex';
        });

        // Expand the selected question
        const questionEl = document.querySelector(`[data-question-id="${questionId}"]`);
        questionEl.classList.remove('minimized');
        questionEl.querySelector('.question__minimized').style.display = 'none';
        questionEl.querySelector('.question__expanded').style.display = 'block';

        // Show question editor
        this.showQuestionEditor(question);
    }

    deleteQuestion(sectionId, questionId) {
        const section = this.formData.sections.find(s => s.id === sectionId);
        if (!section) return;

        const questionIndex = section.questions.findIndex(q => q.id === questionId);
        if (questionIndex > -1) {
            section.questions.splice(questionIndex, 1);
            document.querySelector(`[data-question-id="${questionId}"]`).remove();
            
            // Re-render remaining questions to update numbering
            this.renderQuestions(section);
            
            this.showDefaultEditor();
            this.saveDraft();
        }
    }

    renderQuestions(section) {
        const questionContainer = document.querySelector(`[data-section-id="${section.id}"] .section__questions`);
        if (!questionContainer) return;
        
        questionContainer.innerHTML = '';
        section.questions.forEach(question => {
            this.renderQuestion(section, question);
        });
    }

    addQuestion(sectionId, type) {
        const section = this.formData.sections.find(s => s.id === sectionId);
        if (!section) return;

        const question = {
            id: Date.now(),
            type: type,
            text: 'New Question',
            required: false,
            options: this.getDefaultOptionsForType(type)
        };

        section.questions.push(question);
        this.renderQuestion(section, question);
        this.showQuestionEditor(question);
        this.saveDraft();
    }

    getDefaultOptionsForType(type) {
        switch(type) {
            case 'rating':
                return {
                    max: 5,
                    labels: ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5']
                };
            case 'text':
                return {
                    characterLimit: 500,
                    placeholder: 'Enter your response...'
                };
            case 'multiple':
            case 'checkbox':
                return {
                    options: ['Option 1', 'Option 2', 'Option 3']
                };
            case 'slider':
                return {
                    min: 0,
                    max: 100,
                    step: 1,
                    labels: ['Low', 'High']
                };
            default:
                return {};
        }
    }

    renderQuestion(section, question) {
        const questionContainer = document.querySelector(`[data-section-id="${section.id}"] .section__questions`);
        const questionElement = document.createElement('div');
        questionElement.className = 'question minimized';
        questionElement.dataset.questionId = question.id;
        questionElement.dataset.sectionId = section.id;

        const questionIndex = section.questions.findIndex(q => q.id === question.id) + 1;
        const typeLabels = {
            'rating': 'Rating Scale',
            'text': 'Text Response',
            'multiple': 'Multiple Choice',
            'checkbox': 'Checkboxes',
            'slider': 'Slider'
        };

        questionElement.innerHTML = `
            <div class="question__minimized">
                <div class="question__min-info">
                    <div class="question__min-title">Q${questionIndex}: ${question.text}</div>
                    <div class="question__min-meta">
                        <span class="question__type">${typeLabels[question.type]}</span>
                        ${question.required ? '<span class="question__required-badge">Required</span>' : ''}
                    </div>
                </div>
                <div class="question__min-actions">
                    <button class="btn-text btn-edit" onclick="formBuilder.editQuestion(${section.id}, ${question.id})">Edit</button>
                    <button class="btn-text btn-remove" onclick="formBuilder.deleteQuestion(${section.id}, ${question.id})">Remove</button>
                </div>
            </div>
            <div class="question__expanded" style="display: none;">
                <div class="question__header">
                    <h4 class="question__title">${question.text}</h4>
                    ${question.description ? `<p class="question__description">${question.description}</p>` : ''}
                </div>
                <div class="question__content">
                    ${this.renderQuestionPreview(question)}
                </div>
            </div>
        `;

        questionContainer.appendChild(questionElement);
    }

    renderQuestionPreview(question) {
        switch(question.type) {
            case 'rating':
                return `
                    <div class="preview-scale">
                        ${Array.from({length: question.options.max}, (_, i) => `
                            <div class="scale-option">
                                <div class="scale-number">${i + 1}</div>
                                <div class="scale-label">${question.options.labels[i] || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 'text':
                return `
                    <div class="text-response-preview">
                        <textarea 
                            class="preview-textarea" 
                            placeholder="${question.options.placeholder}"
                            maxlength="${question.options.characterLimit}"
                            disabled></textarea>
                        <div class="character-counter">0 / ${question.options.characterLimit} characters</div>
                    </div>
                `;
            case 'multiple':
                return `
                    <div class="preview-choices">
                        ${question.options.options.map(option => `
                            <div class="choice-option">
                                <input type="radio" disabled>
                                <label>${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 'checkbox':
                return `
                    <div class="preview-choices">
                        ${question.options.options.map(option => `
                            <div class="choice-option">
                                <input type="checkbox" disabled>
                                <label>${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 'slider':
                return `
                    <div class="preview-slider">
                        <div class="slider-labels">
                            <span>${question.options.labels[0]}</span>
                            <span>${question.options.labels[1]}</span>
                        </div>
                        <input type="range" min="${question.options.min}" 
                               max="${question.options.max}" step="${question.options.step}" disabled>
                    </div>
                `;
        }
    }

    showSectionEditor(section) {
        this.activeSection = section;
        this.activeQuestion = null;

        this.defaultEditor.style.display = 'none';
        this.sectionEditor.style.display = 'block';
        this.questionEditor.style.display = 'none';

        // Scroll editor into view
        document.getElementById('editorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.getElementById('sectionTitle').value = section.title;
        document.getElementById('sectionDescription').value = section.description;

        // Update event listeners
        document.getElementById('sectionTitle').oninput = (e) => {
            section.title = e.target.value;
            document.querySelector(`[data-section-id="${section.id}"] .section__title`).textContent = e.target.value;
            this.saveDraft();
        };

        document.getElementById('sectionDescription').oninput = (e) => {
            section.description = e.target.value;
            const sectionEl = document.querySelector(`[data-section-id="${section.id}"]`);
            let descEl = sectionEl.querySelector('.section__description');
            
            if (e.target.value) {
                if (descEl) {
                    descEl.textContent = e.target.value;
                } else {
                    descEl = document.createElement('p');
                    descEl.className = 'section__description';
                    descEl.textContent = e.target.value;
                    sectionEl.querySelector('.section__header').after(descEl);
                }
            } else if (descEl) {
                descEl.remove();
            }
            this.saveDraft();
        };
    }

    showQuestionEditor(question) {
        this.activeQuestion = question;
        this.activeSection = null;

        this.defaultEditor.style.display = 'none';
        this.sectionEditor.style.display = 'none';
        this.questionEditor.style.display = 'block';

        // Hide all question type options
        [this.ratingScaleOptions, this.textResponseOptions, this.choiceOptions, this.sliderOptions]
            .forEach(el => el.style.display = 'none');

        // Show options for current question type
        this.setupQuestionEditorFields(question);
    }

    setupQuestionEditorFields(question) {
        const questionText = document.getElementById('questionText');
        const questionDescription = document.getElementById('questionDescription');
        const requiredCheckbox = document.getElementById('requiredQuestion');

        questionText.value = question.text;
        questionDescription.value = question.description || '';
        requiredCheckbox.checked = question.required;

        // Setup common field listeners
        questionText.oninput = (e) => {
            question.text = e.target.value;
            const questionEl = document.querySelector(`[data-question-id="${question.id}"]`);
            questionEl.querySelector('.question__min-title').textContent = `Q${this.getQuestionNumber(question)}: ${e.target.value}`;
            questionEl.querySelector('.question__title').textContent = e.target.value;
            this.saveDraft();
        };

        questionDescription.oninput = (e) => {
            question.description = e.target.value;
            const questionEl = document.querySelector(`[data-question-id="${question.id}"]`);
            const descEl = questionEl.querySelector('.question__description');
            if (e.target.value) {
                if (descEl) {
                    descEl.textContent = e.target.value;
                } else {
                    const header = questionEl.querySelector('.question__header');
                    const newDesc = document.createElement('p');
                    newDesc.className = 'question__description';
                    newDesc.textContent = e.target.value;
                    header.appendChild(newDesc);
                }
            } else if (descEl) {
                descEl.remove();
            }
            this.saveDraft();
        };

        requiredCheckbox.onchange = (e) => {
            question.required = e.target.checked;
            const questionEl = document.querySelector(`[data-question-id="${question.id}"]`);
            const metaEl = questionEl.querySelector('.question__min-meta');
            let badge = metaEl.querySelector('.question__required-badge');
            
            if (e.target.checked && !badge) {
                badge = document.createElement('span');
                badge.className = 'question__required-badge';
                badge.textContent = 'Required';
                metaEl.appendChild(badge);
            } else if (!e.target.checked && badge) {
                badge.remove();
            }
            this.saveDraft();
        };

        // Setup type-specific options
        switch(question.type) {
            case 'rating':
                this.setupRatingScaleOptions(question);
                break;
            case 'text':
                this.setupTextResponseOptions(question);
                break;
            case 'multiple':
            case 'checkbox':
                this.setupChoiceOptions(question);
                break;
            case 'slider':
                this.setupSliderOptions(question);
                break;
        }
    }

    getQuestionNumber(question) {
        for (let section of this.formData.sections) {
            const index = section.questions.findIndex(q => q.id === question.id);
            if (index !== -1) {
                return index + 1;
            }
        }
        return 1;
    }

    setupRatingScaleOptions(question) {
        this.ratingScaleOptions.style.display = 'block';
        const scaleMax = document.getElementById('scaleMax');
        const scaleLabels = document.getElementById('scaleLabels');
        const labelError = document.getElementById('labelError');

        scaleMax.value = question.options.max;
        scaleLabels.value = question.options.labels.join(', ');

        scaleMax.onchange = (e) => {
            const newMax = parseInt(e.target.value);
            question.options.max = newMax;
            
            // Adjust labels array to match new max
            if (question.options.labels.length > newMax) {
                question.options.labels = question.options.labels.slice(0, newMax);
            } else {
                while (question.options.labels.length < newMax) {
                    question.options.labels.push(`Label ${question.options.labels.length + 1}`);
                }
            }
            
            scaleLabels.value = question.options.labels.join(', ');
            this.validateLabels(question, scaleLabels, labelError);
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        scaleLabels.oninput = (e) => {
            question.options.labels = e.target.value.split(',').map(label => label.trim()).filter(label => label);
            this.validateLabels(question, scaleLabels, labelError);
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        this.validateLabels(question, scaleLabels, labelError);
    }

    validateLabels(question, scaleLabels, labelError) {
        const labelCount = question.options.labels.length;
        const maxScale = question.options.max;
        
        if (labelCount !== maxScale) {
            scaleLabels.classList.add('error');
            labelError.textContent = `Please enter exactly ${maxScale} labels (you have ${labelCount})`;
            labelError.style.display = 'block';
        } else {
            scaleLabels.classList.remove('error');
            labelError.style.display = 'none';
        }
    }

    setupTextResponseOptions(question) {
        this.textResponseOptions.style.display = 'block';
        const characterLimit = document.getElementById('characterLimit');
        const placeholder = document.getElementById('placeholder');

        characterLimit.value = question.options.characterLimit;
        placeholder.value = question.options.placeholder;

        characterLimit.oninput = (e) => {
            question.options.characterLimit = parseInt(e.target.value);
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        placeholder.oninput = (e) => {
            question.options.placeholder = e.target.value;
            this.updateQuestionPreview(question);
            this.saveDraft();
        };
    }

    setupChoiceOptions(question) {
        this.choiceOptions.style.display = 'block';
        const optionsList = document.getElementById('optionsList');
        const addOptionBtn = document.getElementById('addOption');

        // Clear existing options
        optionsList.innerHTML = '';

        // Render options
        question.options.options.forEach((option, index) => {
            this.addOptionInput(optionsList, option, index, question);
        });

        // Add option button
        addOptionBtn.onclick = () => {
            question.options.options.push('New Option');
            this.addOptionInput(optionsList, 'New Option', question.options.options.length - 1, question);
            this.updateQuestionPreview(question);
            this.saveDraft();
        };
    }

    addOptionInput(container, value, index, question) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.innerHTML = `
            <input type="text" value="${value}" placeholder="Option ${index + 1}">
            <button class="btn-icon btn-remove">
                <i class="fas fa-times"></i>
            </button>
        `;

        const input = optionDiv.querySelector('input');
        const removeBtn = optionDiv.querySelector('.btn-remove');

        input.oninput = (e) => {
            question.options.options[index] = e.target.value;
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        removeBtn.onclick = () => {
            question.options.options.splice(index, 1);
            optionDiv.remove();
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        container.appendChild(optionDiv);
    }

    setupSliderOptions(question) {
        this.sliderOptions.style.display = 'block';
        const sliderMin = document.getElementById('sliderMin');
        const sliderMax = document.getElementById('sliderMax');
        const sliderStep = document.getElementById('sliderStep');
        const sliderLabels = document.getElementById('sliderLabels');

        sliderMin.value = question.options.min;
        sliderMax.value = question.options.max;
        sliderStep.value = question.options.step;
        sliderLabels.value = question.options.labels.join(', ');

        const updateSlider = () => {
            question.options.min = parseInt(sliderMin.value);
            question.options.max = parseInt(sliderMax.value);
            question.options.step = parseInt(sliderStep.value);
            question.options.labels = sliderLabels.value.split(',').map(label => label.trim());
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        sliderMin.oninput = updateSlider;
        sliderMax.oninput = updateSlider;
        sliderStep.oninput = updateSlider;
        sliderLabels.oninput = updateSlider;
    }

    updateQuestionPreview(question) {
        const questionElement = document.querySelector(`[data-question-id="${question.id}"] .question__content`);
        questionElement.innerHTML = this.renderQuestionPreview(question);
    }

    showDefaultEditor() {
        this.activeSection = null;
        this.activeQuestion = null;

        this.defaultEditor.style.display = 'block';
        this.sectionEditor.style.display = 'none';
        this.questionEditor.style.display = 'none';
    }

    switchTab(tabId) {
        // Update tab active states
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide tab content
        const tabContents = {
            'design': document.getElementById('designTabContent'),
            'settings': document.getElementById('settingsTabContent'),
            'preview': document.getElementById('previewTabContent')
        };

        Object.keys(tabContents).forEach(key => {
            if (key === tabId) {
                if (key === 'design') {
                    tabContents[key].style.display = 'grid';
                } else {
                    tabContents[key].style.display = 'block';
                }
            } else {
                tabContents[key].style.display = 'none';
            }
        });

        // Generate preview when switching to preview tab
        if (tabId === 'preview') {
            this.generatePreview();
        }
    }

    initializeSettingsListeners() {
        // Course ID
        const courseIdInput = document.getElementById('courseId');
        if (courseIdInput) {
            courseIdInput.value = this.formData.settings.courseId;
            courseIdInput.addEventListener('input', (e) => {
                this.formData.settings.courseId = e.target.value;
                this.saveDraft();
            });
        }

        // Course Description
        const courseDescInput = document.getElementById('courseDescription');
        if (courseDescInput) {
            courseDescInput.value = this.formData.settings.courseDescription;
            courseDescInput.addEventListener('input', (e) => {
                this.formData.settings.courseDescription = e.target.value;
                this.saveDraft();
            });
        }

        // Due Date
        const dueDateInput = document.getElementById('dueDate');
        if (dueDateInput) {
            dueDateInput.value = this.formData.settings.dueDate;
            dueDateInput.addEventListener('change', (e) => {
                this.formData.settings.dueDate = e.target.value;
                this.saveDraft();
            });
        }

        // Due Time
        const dueTimeInput = document.getElementById('dueTime');
        if (dueTimeInput) {
            dueTimeInput.value = this.formData.settings.dueTime;
            dueTimeInput.addEventListener('change', (e) => {
                this.formData.settings.dueTime = e.target.value;
                this.saveDraft();
            });
        }

        // Accessibility
        const accessibilitySelect = document.getElementById('accessibility');
        if (accessibilitySelect) {
            accessibilitySelect.value = this.formData.settings.accessibility;
            accessibilitySelect.addEventListener('change', (e) => {
                this.formData.settings.accessibility = e.target.value;
                this.saveDraft();
            });
        }

        // Require Passcode
        const requirePasscodeCheckbox = document.getElementById('requirePasscode');
        const passcodeInputRow = document.getElementById('passcodeInputRow');
        if (requirePasscodeCheckbox) {
            requirePasscodeCheckbox.checked = this.formData.settings.requirePasscode;
            requirePasscodeCheckbox.addEventListener('change', (e) => {
                this.formData.settings.requirePasscode = e.target.checked;
                passcodeInputRow.style.display = e.target.checked ? 'block' : 'none';
                this.saveDraft();
            });
            // Set initial visibility
            passcodeInputRow.style.display = this.formData.settings.requirePasscode ? 'block' : 'none';
        }

        // Passcode
        const passcodeInput = document.getElementById('passcode');
        if (passcodeInput) {
            passcodeInput.value = this.formData.settings.passcode;
            
            // Only allow numeric input and limit to 6 digits
            passcodeInput.addEventListener('input', (e) => {
                // Remove any non-numeric characters
                let value = e.target.value.replace(/[^0-9]/g, '');
                // Limit to 6 digits
                if (value.length > 6) {
                    value = value.slice(0, 6);
                }
                e.target.value = value;
                this.formData.settings.passcode = value;
                this.saveDraft();
            });
            
            // Validate on blur
            passcodeInput.addEventListener('blur', (e) => {
                const value = e.target.value;
                if (value && value.length !== 6) {
                    alert('Passcode must be exactly 6 digits');
                    e.target.focus();
                }
            });
        }

        // Anonymous Evaluations
        const anonymousCheckbox = document.getElementById('anonymousEvaluations');
        if (anonymousCheckbox) {
            anonymousCheckbox.checked = this.formData.settings.anonymousEvaluations;
            anonymousCheckbox.addEventListener('change', (e) => {
                this.formData.settings.anonymousEvaluations = e.target.checked;
                this.saveDraft();
            });
        }

        // Allow Draft Saving
        const draftSavingCheckbox = document.getElementById('allowDraftSaving');
        if (draftSavingCheckbox) {
            draftSavingCheckbox.checked = this.formData.settings.allowDraftSaving;
            draftSavingCheckbox.addEventListener('change', (e) => {
                this.formData.settings.allowDraftSaving = e.target.checked;
                this.saveDraft();
            });
        }

        // Minimum Team Size
        const minTeamSizeSelect = document.getElementById('minTeamSize');
        if (minTeamSizeSelect) {
            minTeamSizeSelect.value = this.formData.settings.minTeamSize;
            minTeamSizeSelect.addEventListener('change', (e) => {
                this.formData.settings.minTeamSize = parseInt(e.target.value);
                this.validateTeamSizes();
                this.saveDraft();
            });
        }

        // Maximum Team Size
        const maxTeamSizeSelect = document.getElementById('maxTeamSize');
        if (maxTeamSizeSelect) {
            maxTeamSizeSelect.value = this.formData.settings.maxTeamSize;
            maxTeamSizeSelect.addEventListener('change', (e) => {
                this.formData.settings.maxTeamSize = parseInt(e.target.value);
                this.validateTeamSizes();
                this.saveDraft();
            });
        }

        // Student Instructions
        const studentInstructionsTextarea = document.getElementById('studentInstructions');
        if (studentInstructionsTextarea) {
            studentInstructionsTextarea.value = this.formData.settings.studentInstructions;
            studentInstructionsTextarea.addEventListener('input', (e) => {
                this.formData.settings.studentInstructions = e.target.value;
                this.saveDraft();
            });
        }

        // Allow Self-Evaluation
        const selfEvaluationCheckbox = document.getElementById('allowSelfEvaluation');
        if (selfEvaluationCheckbox) {
            selfEvaluationCheckbox.checked = this.formData.settings.allowSelfEvaluation;
            selfEvaluationCheckbox.addEventListener('change', (e) => {
                this.formData.settings.allowSelfEvaluation = e.target.checked;
                this.saveDraft();
            });
        }
    }

    validateTeamSizes() {
        const minSize = this.formData.settings.minTeamSize;
        const maxSize = this.formData.settings.maxTeamSize;
        
        if (minSize > maxSize) {
            alert('Minimum team size cannot be greater than maximum team size!');
            this.formData.settings.minTeamSize = this.formData.settings.maxTeamSize;
            document.getElementById('minTeamSize').value = this.formData.settings.minTeamSize;
        }
    }

    saveDraft() {
        // Save to localStorage
        localStorage.setItem(`form_draft_${this.formData.id}`, JSON.stringify(this.formData));
    }

    loadFormData() {
        const savedData = localStorage.getItem(`form_draft_${this.formData.id}`);
        if (savedData) {
            this.formData = JSON.parse(savedData);
            this.formTitle.value = this.formData.title;
            this.formDescription.value = this.formData.description;
            this.formData.sections.forEach(section => this.renderSection(section));
            
            // Load settings into form fields
            if (this.formData.settings) {
                this.initializeSettingsListeners(); // Re-initialize to populate values
            }
        }
    }

    async publishForm() {
        // Validate form before publishing
        if (!this.formData.title || this.formData.title.trim() === '') {
            alert('Please add a form title before publishing.');
            return;
        }

        if (this.formData.sections.length === 0) {
            alert('Please add at least one section with questions before publishing.');
            return;
        }

        // Check if any section has questions
        const hasQuestions = this.formData.sections.some(s => s.questions && s.questions.length > 0);
        if (!hasQuestions) {
            alert('Please add at least one question to your form before publishing.');
            return;
        }

        try {
            console.log('Publishing form with data:', this.formData);
            console.log('CSRF Token:', this.getCsrfToken());
            
            const response = await fetch('/api/publish-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(this.formData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Try to parse the response
            const responseText = await response.text();
            console.log('Response body:', responseText);

            if (response.ok) {
                const data = JSON.parse(responseText);
                localStorage.removeItem(`form_draft_${this.formData.id}`);
                
                // Show success message
                alert('✅ Form published successfully! Redirecting to Reports...');
                
                // Redirect to reports page
                window.location.href = '/dashboard/faculty/reports/';
            } else {
                let errorMessage = 'Failed to publish form';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error publishing form:', error);
            console.error('Full error details:', error);
            alert('❌ Failed to publish form. Please try again.\n\nError: ' + error.message);
        }
    }

    getCsrfToken() {
        return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    }

    // ======================
    // Preview Tab Methods
    // ======================

    generatePreview() {
        console.log('Generating preview...', this.formData);
        
        // Update form header
        const titleInput = document.querySelector('.form-title');
        const descInput = document.querySelector('.form-description');
        
        document.getElementById('previewTitle').textContent = 
            titleInput?.value.trim() || 'Peer Evaluation Form';
        document.getElementById('previewDescription').textContent = 
            descInput?.value.trim() || 'Form your team and evaluate each teammate based on the criteria below.';

        // Update course info
        const courseId = this.formData.settings.courseId;
        const courseInfoDiv = document.getElementById('previewCourseInfo');
        if (courseId && courseId.trim()) {
            document.getElementById('previewCourseId').textContent = courseId;
            courseInfoDiv.style.display = 'flex';

            // Show due date if provided
            const dueDate = this.formData.settings.dueDate;
            const dueTime = this.formData.settings.dueTime;
            const dueDateContainer = document.getElementById('previewDueDateContainer');
            if (dueDate) {
                let dueDateText = new Date(dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                if (dueTime) {
                    // Convert military time to 12-hour format with AM/PM
                    const [hours, minutes] = dueTime.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
                    dueDateText += ` at ${hour12}:${minutes} ${ampm}`;
                }
                document.getElementById('previewDueDate').textContent = dueDateText;
                dueDateContainer.style.display = 'flex';
            } else {
                dueDateContainer.style.display = 'none';
            }
        } else {
            courseInfoDiv.style.display = 'none';
        }

        // Update instructions
        const instructions = this.formData.settings.teamInstructions;
        const instructionsDiv = document.getElementById('previewInstructions');
        if (instructions && instructions.trim()) {
            document.getElementById('previewInstructionsText').textContent = instructions;
            instructionsDiv.style.display = 'flex';
        } else {
            instructionsDiv.style.display = 'none';
        }

        // Generate sections
        const sectionsContainer = document.getElementById('previewSections');
        const emptyState = document.getElementById('previewEmptyState');
        const footer = document.getElementById('previewFooter');

        if (this.formData.sections.length === 0) {
            sectionsContainer.innerHTML = '';
            emptyState.style.display = 'block';
            footer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            footer.style.display = 'block';
            sectionsContainer.innerHTML = this.formData.sections
                .map(section => this.renderPreviewSection(section))
                .join('');
        }
    }

    renderPreviewSection(section) {
        const hasDescription = section.description && section.description.trim();
        const questions = section.questions || [];

        return `
            <div class="preview-section">
                <div class="preview-section__header">
                    <h2 class="preview-section__title">${this.escapeHtml(section.title)}</h2>
                    ${hasDescription ? `<p class="preview-section__description">${this.escapeHtml(section.description)}</p>` : ''}
                </div>
                <div class="preview-section__content">
                    ${questions.length === 0 ? 
                        '<p style="color: var(--color-text-secondary); text-align: center; padding: 1rem;">No questions added to this section yet.</p>' :
                        `<div class="preview-section__questions">
                            ${questions.map(q => this.renderPreviewQuestion(q)).join('')}
                        </div>`
                    }
                </div>
            </div>
        `;
    }

    renderPreviewQuestion(question) {
        const hasDescription = question.description && question.description.trim();
        const requiredBadge = question.required ? 
            '<span class="preview-question__required">Required</span>' : '';

        let questionContent = '';

        switch (question.type) {
            case 'rating':
                questionContent = this.renderPreviewRating(question);
                break;
            case 'text':
                questionContent = this.renderPreviewText(question);
                break;
            case 'multiple':
                questionContent = this.renderPreviewMultipleChoice(question);
                break;
            case 'checkbox':
                questionContent = this.renderPreviewCheckbox(question);
                break;
            case 'slider':
                questionContent = this.renderPreviewSlider(question);
                break;
            default:
                questionContent = `<p style="color: var(--color-text-secondary);">Question type "${question.type}" not yet supported in preview</p>`;
        }

        return `
            <div class="preview-question">
                <div class="preview-question__header">
                    <h3 class="preview-question__text">${this.escapeHtml(question.text)}</h3>
                    ${requiredBadge}
                </div>
                ${hasDescription ? `<p class="preview-question__description">${this.escapeHtml(question.description)}</p>` : ''}
                ${questionContent}
            </div>
        `;
    }

    renderPreviewRating(question) {
        const scale = question.options?.max || 5;
        const labels = question.options?.labels || [];
        
        let options = '';
        for (let i = 1; i <= scale; i++) {
            const label = labels[i - 1] || `Rating ${i}`;
            options += `
                <div class="preview-rating-option">
                    <button class="preview-rating-button" type="button" disabled>${i}</button>
                    <span class="preview-rating-label">${this.escapeHtml(label)}</span>
                </div>
            `;
        }

        return `
            <div class="preview-rating-scale">
                ${options}
            </div>
        `;
    }

    renderPreviewText(question) {
        const maxLength = question.options?.characterLimit || 500;
        const placeholder = question.options?.placeholder || 'Enter your response here...';

        return `
            <div class="preview-text-response">
                <textarea 
                    placeholder="${this.escapeHtml(placeholder)}"
                    maxlength="${maxLength}"
                    disabled
                ></textarea>
                <div class="preview-character-count">0 / ${maxLength} characters</div>
            </div>
        `;
    }

    renderPreviewMultipleChoice(question) {
        const options = question.options?.options || [];
        
        if (options.length === 0) {
            return '<p style="color: var(--color-text-secondary); font-size: 0.875rem;">No options added yet</p>';
        }

        return `
            <div class="preview-multiple-choice">
                ${options.map((option, index) => `
                    <label class="preview-choice-option">
                        <input type="radio" name="question-${question.id}" value="${index}" disabled>
                        <span class="preview-choice-label">${this.escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    renderPreviewCheckbox(question) {
        const options = question.options?.options || [];
        
        if (options.length === 0) {
            return '<p style="color: var(--color-text-secondary); font-size: 0.875rem;">No options added yet</p>';
        }

        return `
            <div class="preview-multiple-choice">
                ${options.map((option, index) => `
                    <label class="preview-choice-option">
                        <input type="checkbox" name="question-${question.id}-${index}" value="${index}" disabled>
                        <span class="preview-choice-label">${this.escapeHtml(option)}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    renderPreviewSlider(question) {
        const min = question.options?.min || 0;
        const max = question.options?.max || 100;
        const step = question.options?.step || 1;
        const labels = question.options?.labels || ['Low', 'High'];

        return `
            <div class="preview-slider">
                <div class="preview-slider-labels">
                    <span class="preview-slider-label">${this.escapeHtml(labels[0] || 'Min')}</span>
                    <span class="preview-slider-label">${this.escapeHtml(labels[1] || 'Max')}</span>
                </div>
                <input type="range" 
                    min="${min}" 
                    max="${max}" 
                    step="${step}" 
                    value="${min}"
                    class="preview-slider-input"
                    disabled>
                <div class="preview-slider-value">
                    <span class="preview-slider-value-display">${min}</span>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Form Builder
function initFormBuilder() {
    if (window.formBuilder) {
        // Clean up existing instance if any
        window.formBuilder = null;
    }
    window.formBuilder = new FormBuilder();
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initFormBuilder();
});

// Also initialize immediately if DOM is already ready (for SPA navigation)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormBuilder);
} else {
    // DOM already loaded (SPA navigation), initialize now
    initFormBuilder();
}