function selectUser(userId) {
  // Deselect the previously selected user
  if (selectedUserId) {
    document.getElementById(`user-${selectedUserId}`).classList.remove('selected');
    document.getElementById(`edit-and-delete-${selectedUserId}`).style.display = 'none';
  }

  // Select the new user
  selectedUserId = userId;
  document.getElementById(`user-${userId}`).classList.add('selected');
  document.getElementById(`edit-and-delete-${userId}`).style.display = 'block';

  // Update the session variable for the selected user
  fetch(`/updateSelectedUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: selectedUserId })
  }).then(response => {
    if (!response.ok) {
      alert('Failed to update selected user');
    }
  });
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    fetch(`/deleteUser?id=${userId}`, { method: 'DELETE' })
      .then(response => {
        if (response.ok) {
          location.reload(); // Reload the page to reflect the changes
        } else {
          response.text().then(text => alert(text));
        }
      });
  }
}