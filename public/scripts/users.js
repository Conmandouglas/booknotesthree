/*function selectUser(userId) {
  fetch('/updateSelectedUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })
  .then(response => {
    if (response.ok) {
      // Update the UI after successful response
      selectedUserId = userId;
      document.querySelectorAll('.user').forEach(user => {
        user.classList.remove('selected');
      });
      document.querySelector(`#user-${userId}`).classList.add('selected');
      document.querySelectorAll('.edit-and-delete').forEach(buttons => {
        buttons.style.display = 'none';
      });
      document.querySelector(`#edit-and-delete-${userId}`).style.display = 'block';
    } else {
      console.error('Failed to update selected user:', response.statusText);
    }
  })
  .catch(err => {
    console.error('Error:', err);
  });
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    fetch(`/deleteuser?id=${userId}`)
      .then(response => {
        if (response.ok) {
          location.reload();
        } else {
          alert('Failed to delete user.');
        }
      })
      .catch(err => console.error('Error deleting user:', err));
  }
}