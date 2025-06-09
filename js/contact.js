/**
 * @file contact.js
 * @description Handles the client-side functionality for the contact form, including comprehensive input validation,
 * displaying real-time feedback, form submission handling, and local storage integration for submitted data.
 */

/**
 * @description Executes code once the DOM is fully loaded. This ensures all HTML elements are available
 * before attempting to access or manipulate them.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References (Members) ---

    /**
     * @member {HTMLElement} form - Reference to the main contact form element.
     */
    const form = document.getElementById('contact-form');
    /**
     * @member {HTMLInputElement} nameInput - Reference to the input field for the user's name.
     */
    const nameInput = document.getElementById('nameInput');
    /**
     * @member {HTMLInputElement} emailInput - Reference to the input field for the user's email address.
     */
    const emailInput = document.getElementById('emailInput');
    /**
     * @member {HTMLTextAreaElement} messageTextarea - Reference to the textarea field for the user's message.
     */
    const messageTextarea = document.getElementById('messageTextarea');
    /**
     * @member {HTMLElement} successMsg - Reference to the element used to display the success message after form submission.
     */
    const successMsg = document.getElementById('success-message');
    /**
     * @member {HTMLButtonElement} sendButton - Reference to the form's submit button.
     */
    const sendButton = form.querySelector('button[type="submit"]');

    // --- Helper Methods for Validation Feedback ---

    /**
     * @function showValidationFeedback
     * @description Displays or hides validation feedback for a given form element by adding/removing
     * Bootstrap's `is-valid` or `is-invalid` classes and managing a feedback message div.
     * @param {HTMLElement} element - The form control element (e.g., input, textarea) to which feedback applies.
     * @param {boolean} isValid - A boolean indicating whether the element's current value is valid.
     * @param {string} [message=''] - The validation message to display if the element is invalid.
     * Defaults to an empty string if valid.
     * @returns {void}
     */
    function showValidationFeedback(element, isValid, message = '') {
        if (isValid) {
            element.classList.remove('is-invalid');
            element.classList.add('is-valid');
            // Remove existing invalid feedback div if it exists
            if (element.nextElementSibling && element.nextElementSibling.classList.contains('invalid-feedback')) {
                element.nextElementSibling.remove();
            }
        } else {
            element.classList.remove('is-valid');
            element.classList.add('is-invalid');
            // Check if a feedback div already exists for this element
            let feedbackDiv = element.nextElementSibling;
            if (!feedbackDiv || !feedbackDiv.classList.contains('invalid-feedback')) {
                feedbackDiv = document.createElement('div');
                feedbackDiv.classList.add('invalid-feedback');
                // Insert the new feedback div right after the element
                element.parentNode.insertBefore(feedbackDiv, element.nextSibling);
            }
            feedbackDiv.textContent = message; // Set the error message
        }
    }

    /**
     * @function hideAllValidationFeedback
     * @description Iterates through all form controls and removes any active validation feedback
     * (e.g., `is-valid`, `is-invalid` classes and `invalid-feedback` messages).
     * Typically called after a successful submission or on form reset.
     * @returns {void}
     */
    function hideAllValidationFeedback() {
        document.querySelectorAll('.form-control').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid'); // Remove Bootstrap validation classes
            // Remove any dynamically added invalid feedback divs
            if (el.nextElementSibling && el.nextElementSibling.classList.contains('invalid-feedback')) {
                el.nextElementSibling.remove();
            }
        });
    }

    // --- Individual Field Validation Methods ---

    /**
     * @function validateName
     * @description Validates the content of the name input field.
     * Checks for emptiness, minimum length (2 characters), and allowed characters
     * (letters, spaces, hyphens, apostrophes).
     * @returns {boolean} True if the name is valid, false otherwise.
     */
    function validateName() {
        /**
         * @member {string} name - The trimmed value of the name input field.
         * @private
         */
        const name = nameInput.value.trim();
        if (name === '') {
            showValidationFeedback(nameInput, false, 'Name cannot be empty.');
            return false;
        }
        if (name.length < 2) {
            showValidationFeedback(nameInput, false, 'Name must be at least 2 characters long.');
            return false;
        }
        // Basic regex for names (allows letters, spaces, hyphens, apostrophes)
        if (!/^[a-zA-Z\s'-]+$/.test(name)) {
            showValidationFeedback(nameInput, false, 'Name can only contain letters, spaces, hyphens, and apostrophes.');
            return false;
        }
        showValidationFeedback(nameInput, true); // Mark as valid
        return true;
    }

    /**
     * @function validateEmail
     * @description Validates the content of the email input field.
     * Checks for emptiness and adherence to a common email address format using a regular expression.
     * @returns {boolean} True if the email is valid, false otherwise.
     */
    function validateEmail() {
        /**
         * @member {string} email - The trimmed value of the email input field.
         * @private
         */
        const email = emailInput.value.trim();
        /**
         * @member {RegExp} emailRegex - Regular expression for validating email format.
         * @private
         */
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email === '') {
            showValidationFeedback(emailInput, false, 'Email cannot be empty.');
            return false;
        }
        if (!emailRegex.test(email)) {
            showValidationFeedback(emailInput, false, 'Please enter a valid email address.');
            return false;
        }
        showValidationFeedback(emailInput, true); // Mark as valid
        return true;
    }

    /**
     * @function validateMessage
     * @description Validates the content of the message textarea field.
     * Checks for emptiness, minimum length (10 characters), and maximum length (500 characters).
     * @returns {boolean} True if the message is valid, false otherwise.
     */
    function validateMessage() {
        /**
         * @member {string} message - The trimmed value of the message textarea field.
         * @private
         */
        const message = messageTextarea.value.trim();
        /**
         * @constant {number} minLength - The minimum allowed length for the message.
         * @private
         */
        const minLength = 10;
        /**
         * @constant {number} maxLength - The maximum allowed length for the message.
         * @private
         */
        const maxLength = 500;

        if (message === '') {
            showValidationFeedback(messageTextarea, false, 'Message cannot be empty.');
            return false;
        }
        if (message.length < minLength) {
            showValidationFeedback(messageTextarea, false, `Message must be at least ${minLength} characters long.`);
            return false;
        }
        if (message.length > maxLength) {
            showValidationFeedback(messageTextarea, false, `Message cannot exceed ${maxLength} characters.`);
            return false;
        }
        showValidationFeedback(messageTextarea, true); // Mark as valid
        return true;
    }

    // --- Event Listeners for Real-time Validation ---

    /**
     * @description Attaches an 'input' event listener to the name field.
     * This triggers `validateName` whenever the user types, providing real-time feedback.
     */
    nameInput.addEventListener('input', validateName);

    /**
     * @description Attaches an 'input' event listener to the email field.
     * This triggers `validateEmail` whenever the user types, providing real-time feedback.
     */
    emailInput.addEventListener('input', validateEmail);

    /**
     * @description Attaches an 'input' event listener to the message field.
     * This triggers `validateMessage` whenever the user types, providing real-time feedback.
     */
    messageTextarea.addEventListener('input', validateMessage);

    // --- Form Submission Handler ---

    /**
     * @description Attaches a 'submit' event listener to the contact form.
     * This function prevents the default form submission, performs all validations,
     * saves valid data to LocalStorage, displays a success message, and resets the form.
     * @param {Event} e - The submit event object, used to prevent default form behavior.
     * @returns {void}
     */
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the default browser form submission (page reload)

        // Run all validation functions and store their results.
        // This ensures all fields are checked and feedback is shown for all invalid fields.
        /**
         * @member {boolean} isNameValid - Result of name field validation.
         * @private
         */
        const isNameValid = validateName();
        /**
         * @member {boolean} isEmailValid - Result of email field validation.
         * @private
         */
        const isEmailValid = validateEmail();
        /**
         * @member {boolean} isMessageValid - Result of message field validation.
         * @private
         */
        const isMessageValid = validateMessage();

        // If any of the validation checks fail, log a message and stop the submission process.
        if (!isNameValid || !isEmailValid || !isMessageValid) {
            console.log('Form validation failed. Please check the highlighted fields.');
            // Optionally, focus on the first invalid field for better user experience
            if (!isNameValid) nameInput.focus();
            else if (!isEmailValid) emailInput.focus();
            else if (!isMessageValid) messageTextarea.focus();
            return; // Exit the event handler
        }

        // --- LocalStorage Integration ---
        /**
         * @member {Object} submissionData - An object containing the current form input values and a timestamp.
         * @property {string} name - The trimmed name from the input field.
         * @property {string} email - The trimmed email from the input field.
         * @property {string} message - The trimmed message from the textarea.
         * @property {string} timestamp - ISO string representation of the submission time.
         * @private
         */
        const submissionData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageTextarea.value.trim(),
            timestamp: new Date().toISOString() // Record submission time
        };

        // Retrieve existing submissions from LocalStorage, or initialize an empty array
        /**
         * @member {Array<Object>} submissions - Array of all previously and currently submitted contact form data.
         * @private
         */
        let submissions = JSON.parse(localStorage.getItem('contactSubmissions')) || [];
        submissions.push(submissionData); // Add the new submission
        localStorage.setItem('contactSubmissions', JSON.stringify(submissions)); // Save back to LocalStorage

        console.log('Submission saved to LocalStorage:', submissionData);
        // --- End: LocalStorage Integration ---

        // Display the success message to the user
        successMsg.textContent = `Thanks, ${nameInput.value.trim()}! Your message has been sent.`;
        successMsg.classList.remove('d-none'); // Make the message visible (assuming d-none hides it by default)

        // Disable the send button to prevent multiple submissions
        sendButton.disabled = true;

        // Automatically hide the success message, re-enable the button, and clear validation feedback after 3 seconds
        setTimeout(() => {
            successMsg.classList.add('d-none'); // Hide the success message
            sendButton.disabled = false; // Re-enable the button
            hideAllValidationFeedback(); // Clear all validation states (green/red borders)
        }, 3000); // 3000 milliseconds = 3 seconds

        // Clear the form fields after successful submission
        form.reset();
    });
});