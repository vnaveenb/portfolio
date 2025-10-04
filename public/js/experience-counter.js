// Dynamic Experience Counter
class ExperienceCounter {
    constructor() {
        // Career start date: November 1, 2019 (first job at Atos)
        this.startDate = new Date(2019, 10, 1); // Month is 0-indexed, so 10 = November
        this.counterElement = document.getElementById('experience-counter');

        if (this.counterElement) {
            this.calculateAndDisplay();
        }
    }

    calculateAndDisplay() {
        const now = new Date();

        // Calculate total months
        const totalMonths = (now.getFullYear() - this.startDate.getFullYear()) * 12
                          + (now.getMonth() - this.startDate.getMonth());

        // Calculate years and remaining months
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        // Format the display text
        let experienceText = '';

        if (years > 0 && months > 0) {
            experienceText = `${years} Year${years !== 1 ? 's' : ''}, ${months} Month${months !== 1 ? 's' : ''}`;
        } else if (years > 0 && months === 0) {
            experienceText = `${years} Year${years !== 1 ? 's' : ''}`;
        } else if (years === 0 && months > 0) {
            experienceText = `${months} Month${months !== 1 ? 's' : ''}`;
        }

        // Update the counter element
        this.counterElement.textContent = experienceText;

        // Optional: Log for debugging
        console.log(`Experience calculated: ${years} years, ${months} months (Total: ${totalMonths} months)`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ExperienceCounter();
});

export { ExperienceCounter };
