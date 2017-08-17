function addComment() {
   document.querySelector('.add-comment').classList.toggle('hidden');
}

function addExpDate() {
   document.querySelector('.add-exp-date').classList.toggle('hidden');
}

function addSelector() {
   const urlInput = document.querySelector('input[name="url"]');

   if (!urlInput.checkValidity()) {
      const classes = urlInput.parentElement.classList;
      if (classes.contains('form-error')) {
         window.alert('Please enter a valid URL.');
      }
      else {
         classes.add('form-error');
      }
      return;
   }

   const container = document.querySelector('.add-selector');
   const iframe = container.querySelector('iframe');
   const markerTemplate = `
      <style>
         #selector > div {
            position: fixed;
            background: #ff9800;
            transition:all 200ms ease;
            top: -3px;
            left: -3px;
            z-index: 2147483647;
         }
         #selector-top, #selector-bottom { height: 3px; }
         #selector-left, #selector-right { width: 3px; }
      </style>
      <div id="selector">
          <div id="selector-top"></div>
          <div id="selector-left"></div>
          <div id="selector-right"></div>
          <div id="selector-bottom"></div>
      </div>
   `;

   container.classList.toggle('hidden');
   urlInput.parentElement.classList.remove('form-error');
   iframe.src = `/proxy?url=${urlInput.value}`;
   iframe.onload = inject;

   function inject() {
      const iframeDoc = iframe.contentWindow.document;
      const input = container.querySelector('input[name="selector"]');

      iframeDoc.body.innerHTML += markerTemplate;

      const elements = {
         top: iframeDoc.querySelector('#selector-top'),
         left: iframeDoc.querySelector('#selector-left'),
         right: iframeDoc.querySelector('#selector-right'),
         bottom: iframeDoc.querySelector('#selector-bottom'),
      };

      iframeDoc.addEventListener('click', (event) => {
         event.preventDefault();
         input.value = window.UTILS.cssPath(event.target, true);
      });

      // From http://jsfiddle.net/rFc8E/9/
      iframeDoc.addEventListener('mousemove', ({ target }) => {
         if (target.id.indexOf('selector') !== -1 || target.tagName === 'BODY' || target.tagName === 'HTML') return;

         const targetOffset = target.getBoundingClientRect();
         const targetHeight = targetOffset.height;
         const targetWidth = targetOffset.width;

         elements.top.style.top = `${(targetOffset.top - 4)}px`;
         elements.top.style.left = `${(targetOffset.left - 4)}px`;
         elements.top.style.width = `${(targetWidth + 5)}px`;

         elements.bottom.style.top = `${(targetOffset.top + targetHeight + 1)}px`;
         elements.bottom.style.left = `${(targetOffset.left - 3)}px`;
         elements.bottom.style.width = `${(targetWidth + 4)}px`;

         elements.left.style.top = `${(targetOffset.top - 4)}px`;
         elements.left.style.left = `${(targetOffset.left - 5)}px`;
         elements.left.style.height = `${(targetHeight + 8)}px`;

         elements.right.style.top = `${(targetOffset.top - 4)}px`;
         elements.right.style.left = `${(targetOffset.left + targetWidth + 1)}px`;
         elements.right.style.height = `${(targetHeight + 8)}px`;
      });
   }
}
