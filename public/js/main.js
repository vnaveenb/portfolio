// Portfolio Main JavaScript
// Loads data from profile.json and handles all interactions

let globalProfileData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load profile data
    const profileData = await loadProfileData();
    globalProfileData = profileData;
    
    if (profileData) {
        renderProfile(profileData);
        renderHighlights(profileData.about.highlights);
        renderExperience(profileData.experience);
        renderSkills(profileData.skills);
        renderEducation(profileData.education);
        renderCertifications(profileData.certifications);
        calculateExperience(profileData.personal.careerStartDate);
    }

    // Initialize interactions
    initMobileMenu();
    initScrollReveal();
    initSmoothScroll();
    initCopyMarkdown();
});

// Load profile data from JSON
async function loadProfileData() {
    try {
        const response = await fetch('/data/profile.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading profile data:', error);
        return null;
    }
}

// Calculate and display experience
function calculateExperience(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    let experienceText = '';
    if (years > 0) {
        experienceText += `${years} Year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (years > 0) experienceText += ' ';
        experienceText += `${months} Month${months > 1 ? 's' : ''}`;
    }
    
    document.getElementById('experience-years').textContent = `"${experienceText}"`;
}

// Render profile text
function renderProfile(data) {
    const profileText = document.getElementById('profile-text');
    if (profileText && data.about.profile) {
        profileText.textContent = data.about.profile;
    }
}

// Render highlights grid
function renderHighlights(highlights) {
    const grid = document.getElementById('highlights-grid');
    if (!grid || !highlights) return;

    const iconMap = {
        'robot': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
        'code': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
        'cloud': `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>`
    };

    const colorClasses = ['text-green-400', 'text-blue-400', 'text-purple-400'];

    grid.innerHTML = highlights.map((highlight, index) => `
        <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-5 hover:border-neutral-700 transition-all hover:-translate-y-1">
            <div class="${colorClasses[index % colorClasses.length]} mb-3">
                ${iconMap[highlight.icon] || iconMap['code']}
            </div>
            <h3 class="font-semibold text-white mb-2">${highlight.title}</h3>
            <p class="text-sm text-gray-400">${highlight.description}</p>
        </div>
    `).join('');
}

// Render experience section
function renderExperience(experience) {
    const container = document.getElementById('experience-list');
    if (!container || !experience) return;

    container.innerHTML = experience.map(job => `
        <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                    <h3 class="text-xl font-bold text-white">${job.title}</h3>
                    <p class="text-cyan-400 font-mono">${job.company}</p>
                    ${job.location ? `<p class="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        ${job.location}
                    </p>` : ''}
                </div>
                <span class="text-sm font-mono ${job.isCurrent ? 'text-green-400' : 'text-gray-500'} mt-2 md:mt-0">
                    ${job.startDate} — ${job.endDate}
                </span>
            </div>
            
            ${job.responsibilities.map(resp => `
                <div class="mt-4">
                    <h4 class="text-purple-400 font-mono text-sm mb-3">// ${resp.category}</h4>
                    <ul class="space-y-2">
                        ${resp.items.map(item => `
                            <li class="flex items-start gap-3 text-gray-300 text-sm">
                                <span class="text-green-400 mt-1.5 flex-shrink-0">▹</span>
                                <span>${item}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Render skills section
function renderSkills(skills) {
    const container = document.getElementById('skills-grid');
    if (!container || !skills) return;

    const skillStyles = {
        programming: { color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' },
        aiml: { color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)' },
        devops: { color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' },
        cloud: { color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.1)', borderColor: 'rgba(96, 165, 250, 0.3)' },
        tools: { color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.1)', borderColor: 'rgba(34, 211, 238, 0.3)' },
        visualization: { color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.3)' }
    };

    let html = '';

    for (const [key, skill] of Object.entries(skills)) {
        const style = skillStyles[key] || skillStyles.programming;
        
        if (skill.categories) {
            // AI/ML with subcategories
            html += `
                <div class="md:col-span-2 bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <h3 class="font-mono mb-4" style="color: ${style.color}">// ${skill.title}</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        ${skill.categories.map(cat => `
                            <div>
                                <p class="text-gray-500 text-sm mb-2">${cat.name}</p>
                                <div class="flex flex-wrap gap-2">
                                    ${cat.items.map(item => `
                                        <span class="px-3 py-1 text-sm rounded-full" style="background: ${style.bgColor}; border: 1px solid ${style.borderColor}; color: ${style.color}">${item}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (skill.items) {
            // Simple skill list
            html += `
                <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <h3 class="font-mono mb-4" style="color: ${style.color}">// ${skill.title}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${skill.items.map(item => `
                            <span class="px-3 py-1 text-sm rounded-full" style="background: ${style.bgColor}; border: 1px solid ${style.borderColor}; color: ${style.color}">${item}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// Render education
function renderEducation(education) {
    const container = document.getElementById('education-list');
    if (!container || !education) return;

    container.innerHTML = `
        <h3 class="font-mono text-blue-400 mb-4">// Education</h3>
        ${education.map(edu => `
            <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5 hover:border-neutral-700 transition-all mb-4">
                <h4 class="font-semibold text-white mb-1">${edu.degree}</h4>
                <p class="text-cyan-400 text-sm">${edu.institution}</p>
                <p class="text-gray-500 text-sm font-mono mt-2">${edu.startDate} — ${edu.endDate}</p>
            </div>
        `).join('')}
    `;
}

// Render certifications
function renderCertifications(certifications) {
    const container = document.getElementById('certifications-list');
    if (!container || !certifications) return;

    container.innerHTML = `
        <h3 class="font-mono text-yellow-400 mb-4">// Certifications</h3>
        ${certifications.map(cert => `
            <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-5 hover:border-neutral-700 transition-all mb-4">
                <div class="flex items-start gap-3">
                    <div class="text-yellow-400 mt-1">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-white text-sm">${cert.name}</h4>
                        <p class="text-gray-400 text-sm">${cert.issuer}</p>
                        <p class="text-gray-500 text-xs font-mono mt-1">Issued: ${cert.issueDate}${cert.expiryDate ? ` • Expires: ${cert.expiryDate}` : ''}</p>
                        ${cert.credentialUrl ? `
                            <a href="${cert.credentialUrl}" target="_blank" class="inline-flex items-center gap-1 text-yellow-400 text-sm mt-2 hover:underline">
                                <span>View Credential</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// Mobile menu toggle
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
        
        // Close menu when clicking a link
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.add('hidden');
            });
        });
    }
}

// Scroll reveal animation
function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Copy as Markdown functionality
function initCopyMarkdown() {
    const buttons = [
        { btn: document.getElementById('copy-markdown-btn'), text: document.getElementById('copy-btn-text') },
        { btn: document.getElementById('copy-markdown-btn-mobile'), text: document.getElementById('copy-btn-text-mobile') }
    ];
    
    buttons.forEach(({ btn, text }) => {
        if (btn && text && globalProfileData) {
            btn.addEventListener('click', async () => {
                const markdown = generateMarkdown(globalProfileData);
                
                try {
                    await navigator.clipboard.writeText(markdown);
                    text.textContent = '✓ copied!';
                    btn.classList.remove('border-terminal-purple/50', 'text-terminal-purple');
                    btn.classList.add('border-green-400', 'text-green-400');
                    
                    setTimeout(() => {
                        text.textContent = '.copyMD()';
                        btn.classList.remove('border-green-400', 'text-green-400');
                        btn.classList.add('border-terminal-purple/50', 'text-terminal-purple');
                    }, 2000);
                } catch (err) {
                    text.textContent = '✗ failed';
                    setTimeout(() => {
                        text.textContent = '.copyMD()';
                    }, 2000);
                }
            });
        }
    });
}

// Generate Markdown from profile data
function generateMarkdown(data) {
    const { personal, social, about, experience, skills, education, certifications, interests } = data;
    
    let md = '';
    
    // Header
    md += `# ${personal.name}\n\n`;
    md += `**${personal.title}**\n\n`;
    
    // Contact Info
    md += `## Contact\n\n`;
    md += `- 📧 Email: [${personal.email}](mailto:${personal.email})\n`;
    md += `- 📱 Phone: ${personal.phone}\n`;
    md += `- 📍 Location: ${personal.location}\n`;
    if (social.linkedin) md += `- 💼 LinkedIn: [${social.linkedin}](${social.linkedin})\n`;
    if (social.twitter) md += `- 🐦 Twitter: [${social.twitter}](${social.twitter})\n`;
    if (social.github) md += `- 💻 GitHub: [${social.github}](${social.github})\n`;
    md += `\n`;
    
    // About / Profile
    md += `## Profile\n\n`;
    md += `${about.profile}\n\n`;
    
    // Experience
    md += `## Work Experience\n\n`;
    experience.forEach(job => {
        md += `### ${job.title}\n`;
        md += `**${job.company}**${job.location ? ` | 📍 ${job.location}` : ''} | ${job.startDate} - ${job.endDate}\n\n`;
        
        job.responsibilities.forEach(resp => {
            if (resp.category !== 'General') {
                md += `#### ${resp.category}\n\n`;
            }
            resp.items.forEach(item => {
                md += `- ${item}\n`;
            });
            md += `\n`;
        });
    });
    
    // Skills
    md += `## Technical Skills\n\n`;
    for (const [key, skill] of Object.entries(skills)) {
        md += `### ${skill.title}\n\n`;
        if (skill.categories) {
            skill.categories.forEach(cat => {
                md += `**${cat.name}:** ${cat.items.join(', ')}\n\n`;
            });
        } else if (skill.items) {
            md += `${skill.items.join(', ')}\n\n`;
        }
    }
    
    // Education
    md += `## Education\n\n`;
    education.forEach(edu => {
        md += `### ${edu.degree}\n`;
        md += `**${edu.institution}** | ${edu.startDate} - ${edu.endDate}\n\n`;
    });
    
    // Certifications
    md += `## Certifications\n\n`;
    certifications.forEach(cert => {
        md += `- **${cert.name}** - ${cert.issuer} (${cert.issueDate})`;
        if (cert.credentialUrl) md += ` [View Credential](${cert.credentialUrl})`;
        md += `\n`;
    });
    md += `\n`;
    
    // Interests
    if (interests && interests.length > 0) {
        md += `## Interests\n\n`;
        md += interests.join(' | ') + `\n`;
    }
    
    return md;
}

