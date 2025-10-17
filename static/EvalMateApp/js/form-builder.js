// Form Builder Class
class FormBuilder {
    constructor() {
        this.formData = {
            id: Date.now(),
            title: '',
            description: '',
            sections: []
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

        // Add section button
        this.addSectionBtn.addEventListener('click', () => this.addSection());

        // Tab navigation
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Save and publish buttons
        document.getElementById('saveDraft').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishForm').addEventListener('click', () => this.publishForm());
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
                    labels: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']
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
        questionElement.className = 'question';
        questionElement.dataset.questionId = question.id;

        questionElement.innerHTML = `
            <div class="question__header">
                <h4 class="question__title">
                    ${question.text}
                    ${question.required ? '<span class="required">*</span>' : ''}
                </h4>
                <div class="question__actions">
                    <button class="btn btn-icon" onclick="formBuilder.editQuestion(${question.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon" onclick="formBuilder.deleteQuestion(${section.id}, ${question.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question__content">
                ${this.renderQuestionPreview(question)}
            </div>
        `;

        questionContainer.appendChild(questionElement);
    }

    renderQuestionPreview(question) {
        switch(question.type) {
            case 'rating':
                return `
                    <div class="preview-scale">
                        ${question.options.labels.map((label, i) => `
                            <div class="scale-option">${i + 1}</div>
                        `).join('')}
                    </div>
                `;
            case 'text':
                return `
                    <textarea disabled placeholder="${question.options.placeholder}"
                              maxlength="${question.options.characterLimit}"></textarea>
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
            document.querySelector(`[data-question-id="${question.id}"] .question__title`).innerHTML = 
                `${e.target.value}${question.required ? '<span class="required">*</span>' : ''}`;
            this.saveDraft();
        };

        questionDescription.oninput = (e) => {
            question.description = e.target.value;
            this.saveDraft();
        };

        requiredCheckbox.onchange = (e) => {
            question.required = e.target.checked;
            document.querySelector(`[data-question-id="${question.id}"] .question__title`).innerHTML = 
                `${question.text}${e.target.checked ? '<span class="required">*</span>' : ''}`;
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

    setupRatingScaleOptions(question) {
        this.ratingScaleOptions.style.display = 'block';
        const scaleMax = document.getElementById('scaleMax');
        const scaleLabels = document.getElementById('scaleLabels');

        scaleMax.value = question.options.max;
        scaleLabels.value = question.options.labels.join(', ');

        scaleMax.onchange = (e) => {
            question.options.max = parseInt(e.target.value);
            this.updateQuestionPreview(question);
            this.saveDraft();
        };

        scaleLabels.oninput = (e) => {
            question.options.labels = e.target.value.split(',').map(label => label.trim());
            this.updateQuestionPreview(question);
            this.saveDraft();
        };
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
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
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
        }
    }

    async publishForm() {
        try {
            const response = await fetch('/api/publish-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(this.formData)
            });

            if (response.ok) {
                alert('Form published successfully!');
                localStorage.removeItem(`form_draft_${this.formData.id}`);
            } else {
                throw new Error('Failed to publish form');
            }
        } catch (error) {
            console.error('Error publishing form:', error);
            alert('Failed to publish form. Please try again.');
        }
    }

    getCsrfToken() {
        return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    }
}

// Initialize Form Builder
document.addEventListener('DOMContentLoaded', () => {
    window.formBuilder = new FormBuilder();
});