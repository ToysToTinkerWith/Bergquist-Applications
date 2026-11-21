import { INTRO_ANSWER } from './assistantConversation.js'
import { CONTACT_EMAIL } from './contactDetails.js'

const faq = [
  { questions: ['What are web components?', 'What is a web component?'], answer: INTRO_ANSWER, route: { href: '/components', label: 'Website features & components' } },
  { questions: ['What is Bergquist Applications?', 'What does Bergquist Applications do?'], answer: "Bergquist Applications builds custom websites and web applications around your business. You work directly with Anders Bergquist on the design, useful features, and ongoing care of your website.", route: { href: '/applications', label: 'Project examples' } },
  { questions: ['How can I contact Bergquist Applications?', 'How can I contact you?', 'What is your email address?'], answer: `You can email Anders at ${CONTACT_EMAIL}, or use the contact form to tell him what you have in mind. He works remotely and can meet in person on Whidbey Island by arrangement.`, route: { href: '/contact', label: 'Contact Anders' } },
  { questions: ['What does a website from Bergquist Applications cost?', 'How much does a website cost?', 'What are your prices?'], answer: 'The starting website is $500 to build, plus $20 a month for maintenance. It includes Home, About, products or services, and Contact pages, tailored to your brand and supplied content. Extra features, integrations, and third-party costs are quoted separately; the included work is agreed before building begins.', route: { href: '/contact', label: 'Discuss your website' } },
  { questions: ['Can you improve the website I already have?'], answer: "Yes. Anders can look at your current website, talk through what is working and what you would like to improve, then recommend a focused update or a rebuild. Share your website and the changes you have in mind so he can assess the work and give you a quote.", route: { href: '/contact', label: 'Talk about your current website' } },
  { questions: ['How can my website bring in more inquiries?'], answer: 'Make it easy for visitors to understand what you offer, see examples of your work, and contact you. A clear contact form, useful answers to common questions, and a booking or estimate tool can help people take the next step. Anders can help choose the features that fit your business; no website can guarantee a particular number of inquiries.', route: { href: '/components', label: 'Explore useful website features' } },
  { questions: ['What do you need from me to get started?'], answer: 'Start with what your business does, who your customers are, and what you want the website to help them do. Your current website, logo, photos, and a few examples you like are useful too. You do not need everything figured out before getting in touch; Anders can help you work through the next steps.', route: { href: '/contact', label: 'Start the conversation' } },
  { questions: ['Will it cost less or launch faster?'], answer: 'Yes, AI-assisted development helps us deliver faster and more cost-effective web applications. Your final cost and timeline still depend on the project scope, features, and integrations.', route: { href: '/contact', label: 'Discuss your project' } },
  { questions: ['How do you approach quality?'], answer: "Anders builds a working prototype, gathers your feedback, and keeps refining and testing it until it fits the agreed goals. If you want to add features or change how something works, you have a direct way to discuss the update and its scope.", route: { href: '/about', label: 'How Anders works' } },
]
const normalize = value => String(value || '').trim().toLowerCase().replace(/[?!.]+$/, '').replace(/\s+/g, ' ')
const answers = new Map(faq.flatMap(item => item.questions.map(question => [normalize(question), item])))

// Exact, self-contained questions only: custom questions and follow-ups still
// go to the model with their conversation context. Never cache personal answers.
export function assistantQuickAnswer(prompt) {
  const item = answers.get(normalize(prompt))
  return item ? { mode: 'answer', answer: item.answer, route: { ...item.route }, showSavedMedia: false, showSavedDataList: false, needsClarification: false, clarificationFor: null, savedItems: [] } : null
}
