class User {
    constructor(data) { // конструктор
        this.data = data;
    }

    edit(updatedData) {  //сделал метод редактирования User
        this.data = {
            ...this.data,
            ...updatedData
        }
    }

    get() {  // вывод user 
        return this.data
    }
}

//=================================================

class Contacts {
    constructor() {
        this.contactsData = [];
    }

    createUserFromLocalStorage() { // метод который перерисовывает контактную книгу в зависимости от localStorage
        const localSrorageData = JSON.parse(localStorage.getItem('contactsItem'));// записали в новую переменную
        if (!localSrorageData) { // сделали проверку, если localStorage пустой то мы ничего не делаем 

            return undefined
        }

        const userFromLocalStorage = localSrorageData.map((item)=>{ // перебираем наши данные с localStorsge с помощью Map и изменяем наши элементы 
            return new User(item.data);
        })

        return userFromLocalStorage // возвращаем данные из localStorage
    }

    async getData() {  // асинхронная функция , возвращает промис
        try {
            const responce = await fetch('https://jsonplaceholder.typicode.com/users'); // получили ссылку с который мы вытаскиеваем данные 
            if (responce.status >= 400 && responce.status <= 420 || responce.status >= 500 && responce.status <= 520) {
                throw new Error ('error'); //сделали проверку на ощибки 
            }
            const serverData = await responce.json(); // вернули в формате json
            const data = this.serverDataMaper(serverData);
            return data;
        } catch (error) {
            console.error(error);
        }
    }

    serverDataMaper(data) { // вынесли мапер
        return data.map(({address: {city, street}, name, id, phone, email}) => new User({ // перебираем дату через map и возвращаем новый массив// реструктуризируем получаемые данные// возвращаем нового юзера
                                                                                            address: `${city}${street}`,
                                                                                            name,
                                                                                            id: `${id}`, // id преобразовали в строку 
                                                                                            phone, 
                                                                                            email
                                                                                        }))
        
    }

    setLocalStorage() {
        localStorage.setItem('contactsItem', JSON.stringify(this.contactsData)) // создали localStorage метод
        this.setCookie();
    }

    async getValidateContactData() { // тоже делаем асинхронной
        const isContactsCookie = !!this.getCookie('contactCookie'); //проверяем есть ли у нас куки 
        if(isContactsCookie) { // если есть куки
            return this.createUserFromLocalStorage() ?? []; 
        }
        localStorage.removeItem('contactsItem');// если кук нету , то все уудаляем 
        return await this.getData();
    }

    getCookie(name) {
        let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
      }

    setCookie() { // создаем куки
        document.cookie = `contactCookie = contacts; max-age=${25}`
    }

    add(userData) {  // добавление нового user в контактную книгу 
        this.contactsData.push(new User(userData))
        this.setLocalStorage();// создали localStorage из нашего массива
    }

    editContactUser (id, updatedUserData) {  // редактируем user в контактной книге 
        this.contactsData = this.contactsData.map((user)=>{
            if (user.data.id === id) {
                user.edit(updatedUserData)
            }
            return user;
        }) 
        this.setLocalStorage();// обновили localStorageeee
    }

    remove(id) { // удаление user из контактной книги 
        this.contactsData = this.contactsData.filter((user)=> user.data.id !== id);
        // this.contactsData = this.contactsData.filter(({data: {id: userId}})=> userId !== id)
        this.setLocalStorage(); // обновили localstorage
    }

    get() {  // просмотр контактной книги 
        return this.contactsData;
    }
}

// =====================================================

class ContsctApp extends Contacts {
    constructor() {
        super();
        this.app = this.createRootElement(); // создаем структуру нашей формы в браузерном окне

        document.body.appendChild(this.app);
        this.addContactEvent() // заупустили метод клика по кнопке "создать контакт"
        this.startApp();
        this.self = this;
    }

    startApp () { // запуск моего приложения 
        const preloader = document.createElement('div');
        preloader.classList.add('preloader');
        preloader.innerHTML = `<h2 class="preloader__text">Data is loading ...</h2>`
        document.body.appendChild(preloader);
        this.getValidateContactData().then((data) => { // запускаю здесь асинхронную функ и использую then
            preloader.remove();
            this.contactsData = data; //полученные данные я устанавливаю в массив моих данных
            this.setLocalStorage();
            this.get();// запускаю рендер
        })
    }

    createRootElement() { // формируется контакт в нашей книге 
        const rootElement = document.createElement('div');
        rootElement.classList.add('contacts');
        rootElement.innerHTML = `
                                    <div class="container">
                                        <div class="contact__wrapper">
                                            <div class="contacts__header">
                                                <h2>Контакты</h2>
                                                <div class ="contacts__form">
                                                    <input type="text" class="contact__name" placeholder="Имя">
                                                    <input type="text" class="contact__phone" placeholder="Телефон">
                                                    <input type="text" class="contact__email" placeholder="email">
                                                    <input type="text" class="contact__address" placeholder="Адрес">
                                                    <button class="contact__btn">Добавить контакт</button>
                                                </div>  
                                            </div>
                                            <div class="contacts__body"></div>
                                        </div>
                                    </div>
                                `

        return rootElement;
    }

    addContactEvent() { // метод навешивает обработчик который навешивает обработчик на "Добавить контакт"
        const addBtn = document.querySelector('.contact__btn');
        addBtn.addEventListener('click', ()=> {
            this.onAdd()
        })
    }    

    onAdd() { // метод клика по кнопке
        const name = document.querySelector('.contact__name');
        const phone = document.querySelector('.contact__phone');
        const email = document.querySelector('.contact__email');
        const address = document.querySelector('.contact__address');

        const userData = {  
            id: new Date().getTime().toString(),
            name: name.value,
            phone: phone.value,
            email: email.value,
            address: address.value
        }

        this.add(userData); // делаем так что бы в строчке после нажатия создать контакт  чистились строки 
        name.value = '';
        phone.value = '';
        email.value = '';
        address.value = '';

        this.get();
    }

    get() {  // выводим что у нас находится в контактной книге , наследуем с  Contscts
        const getContactsData = super.get(); // равен родительскому методу get 
        const contactsBodyElement = document.querySelector('.contacts__body');

        let ulContacts = document.querySelector('.contacts__items');

        if(!ulContacts) { // делаем проверку , есть у нас уже список ul или нет
           ulContacts = document.createElement('ul'); // создаем список есди его нет
           ulContacts.classList.add('contacts__items');
        } else {  // если есть то чистим и каждый раз переписываем его 
            ulContacts.innerHTML = '';
        }

        

        let contactList = '';
        getContactsData.forEach(({data})=> { // в колбек функцию передаем реструктуризированную дату  перебираем массив нашей контактной книги 
            const {name, phone, email, id, address} = data;
            contactList += `<li class="item">
                                <div class="item__elem item__name">Имя: ${name}</div>
                                <div class="item__elem item__phone">Телефон: ${phone}</div>
                                <div class="item__elem item__email">email: ${email}</div>
                                <div class="item__elem item__address">Адрес: ${address}</div>
                                <div class="item__btns">
                                    <button class="btn__delete" id="${id}">Удалить</batton>
                                    <button class="btn__edit" data-edit="${id}">Редактировать</batton>
                                </div>
                            </li>`
        });
        ulContacts.innerHTML = contactList;
        contactsBodyElement.appendChild(ulContacts);
        this.addDeleteEventBtns();
        this.addEditEventBtns();

    }


    onRemove(id) {
        this.remove(id);
        this.get(); 
    }

    onStartEdit(editId) { // начало редактирования

        const getContactsData = super.get(); // забираем наши данные из родителя , вернет массив записей нашей контактной книги
        const editUserData = getContactsData.find(({data: {id}})=> id === editId).data // перебираем методом find и по заданному ид находим массив
        const modal = new Modal(editUserData, this.onEdit.bind(this));  // дальге когда мы нашли id мы выкидываем модальное окно  с этим юзером и прокидываем контент ContactApp
        // вторым элементов прокидываем функцию
    }

    onEdit({id, ...updatedData}) { // спред оператором разделяем id и обновленный объект данных
        this.self.editContactUser(id, updatedData); // ождиет метод id и обновленную дату 
        this.self.get(); // перерисовываем 
    } 

    addEditEventBtns() { // реализуем нажатие кнопки редактировать 
        const editContactBtns = document.querySelectorAll('.btn__edit');
        editContactBtns.forEach((editBtn)=>{
            editBtn.addEventListener('click', (event)=>{
                this.onStartEdit(event.target.dataset.edit);
            })
        })
    }

    addDeleteEventBtns() { // реализуем нажатие кнопки удалить
        const deleteContactBtns = document.querySelectorAll('.btn__delete'); // нахолим наши кнопки 
        deleteContactBtns.forEach((deleteBtn)=>{ // перебираем объект наших кнопок 
            deleteBtn.addEventListener('click', (event)=> { // на каждую кнопку накидываем обработчик событий и в колбек функцию прокидываем наш евент
                this.onRemove(event.target.id); // и потом вытаскиваем id user по которому тыкнули и удаляем 
               
            })
        })
    }
}

class Modal { // создаем класс для модального окна 
    constructor(contactData, onEdit) { // прокинули ее в конструктор модалки 
        this.contactData = contactData;
        this.heandleUserEdit = onEdit; // сохранил в переменную функцию
        this.modalHtmlElement = this.createModalHtm(this.contactData); //запускаем метод создания модального окна
        document.body.appendChild(this.modalHtmlElement) // пушим наше модальное окго в боди
        this.addCancelEvent();
        this.addSaveEvent();
    }

    addCancelEvent() { // метод который накидывает действие на кнопку отменить в модльном окне
        const cancelBtn = document.querySelector('.modal__cancel__btn');
        cancelBtn.addEventListener('click', ()=>{
            this.modalHtmlElement.remove()
        })
    }

    addSaveEvent () { // создаем метод который навешивает обработчик на кнопку редактирования
        const saveBtn = document.querySelector('.modal__save__btn');
        saveBtn.addEventListener('click', (event)=>{
            const name = document.querySelector('.modal__edit__name').value; // находим все инпуты и забираем их value
            const phone = document.querySelector('.modal__edit__phone').value;
            const email = document.querySelector('.modal__edit__email').value;
            const address = document.querySelector('.modal__edit__address').value;
            this.heandleUserEdit({ // выводим этот объект
                name,
                phone,
                email,
                address,
                id: event.target.id
            });// вызываем нашу функцию которая хранит работу другойфункции
            this.modalHtmlElement.remove()// по нажатию на сохранить , закрываем модальное окно
        })
    }

    createModalHtm({name, phone, email, id, address}) {  // метод который создает модальное окно
        const modalHtml = document.createElement('div'); // создаем div 
        modalHtml.classList.add('modal'); // присвоили класс
        modalHtml.innerHTML = `<div class="modal__wrapper">  
                                    <div class="modal__header">
                                        <h3>Редактирование пользователя</h3>
                                    </div>
                                    <div class="modal__content">
                                        <input type="text" class="modal__edit__name" value="${name}">
                                        <input type="phone" class="modal__edit__phone" value="${phone}">
                                        <input type="text" class="modal__edit__email" value="${email}">
                                        <input type="text" class="modal__edit__address" value="${address}">
                                        <div class="modal__btns">
                                            <button class="modal__cancel__btn">Отмена</button>
                                            <button class="modal__save__btn" id="${id}">Сохранить</button>
                                        </div>
                                    </div>
                               </div>`   // просто закидываем нашу разметку в этот div
        return modalHtml   // возвращаем наш div
    }


}

const app = new ContsctApp();