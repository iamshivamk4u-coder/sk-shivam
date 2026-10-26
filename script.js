const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
});

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => menuButton?.setAttribute('aria-expanded', 'false'));
});

const enrollmentDialog = document.querySelector('#enrollment-dialog');
const enrollmentForm = document.querySelector('#enrollment-form');
const selectedCourse = document.querySelector('.selected-course');
const selectedCourseInput = document.querySelector('#selected-course-input');
const closeDialog = document.querySelector('.dialog-close');

document.querySelectorAll('.enroll-button').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const course = button.dataset.course;
    selectedCourse.textContent = course;
    selectedCourseInput.value = course;
    enrollmentForm.querySelector('.form-success').hidden = true;
    enrollmentDialog.showModal();
  });
});

closeDialog?.addEventListener('click', () => enrollmentDialog.close());

enrollmentForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  enrollmentForm.querySelector('.form-success').hidden = false;
  enrollmentForm.querySelector('button[type="submit"]').disabled = true;
});

enrollmentDialog?.addEventListener('close', () => {
  enrollmentForm.reset();
  enrollmentForm.querySelector('button[type="submit"]').disabled = false;
});
